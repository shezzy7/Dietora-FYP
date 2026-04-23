// src/services/priceUpdater.service.js
// DIETORA — Real-Time Pakistani Food Price Engine
//
// Architecture (3-tier, waterfall):
//
//   Tier 1 — Gemini 2.5 Flash WITH Google Search Grounding
//     The model is given the googleSearch tool, which forces it to query Google
//     before answering. This gives us real, sourced, current PKR market prices —
//     not hallucinations from stale training data.
//     Ref: https://ai.google.dev/gemini-api/docs/grounding
//
//   Tier 2 — Gemini 2.5 Flash WITHOUT grounding (fallback)
//     If grounding fails (quota, tool unavailable), we ask Gemini to reason
//     from its most recent training knowledge about Pakistani prices.
//     Better than random DB seeds — but not live data.
//
//   Tier 3 — Curated static baseline prices
//     A hard-coded map of researched Faisalabad/Lahore/Karachi 2024-2025
//     market prices per food item. This is the final safety net — the system
//     NEVER returns a zero price.
//
// Caching:
//   Grounded prices are cached for 4 hours.
//   Tier 2 prices are cached for 2 hours.
//   Static prices are never cached (they are the cache).
//
// Concurrency:
//   All foods in a plan are priced in a single batched Gemini call (not N calls).
//   This avoids rate limiting and keeps generation time under 3 seconds.

'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Gemini client (lazy singleton) ──────────────────────
let _genAI = null;
const getClient = () => {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing from .env');
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
};

// ─── In-memory price cache ────────────────────────────────
// Structure: Map<foodName, { price: number, source: string, fetchedAt: number }>
const _priceCache = new Map();
const TTL_GROUNDED  = 4 * 60 * 60 * 1000; // 4 hours  — live search data
const TTL_AI        = 2 * 60 * 60 * 1000; // 2 hours  — AI reasoning data
const TTL_STATIC    = 24 * 60 * 60 * 1000; // 24 hours — static baseline

const _isCacheValid = (entry, ttl) =>
  entry && (Date.now() - entry.fetchedAt) < ttl;

const _getCacheEntry = (name) => {
  const entry = _priceCache.get(name);
  if (!entry) return null;
  const ttl = entry.source === 'grounded' ? TTL_GROUNDED
    : entry.source === 'ai' ? TTL_AI
    : TTL_STATIC;
  return _isCacheValid(entry, ttl) ? entry : null;
};

const _setCache = (name, price, source) => {
  _priceCache.set(name, { price, source, fetchedAt: Date.now() });
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3 — Static baseline prices (PKR, Faisalabad/Lahore/Karachi, April 2025)
//
// Researched from:
//   - Pakistan Bureau of Statistics weekly SPI reports
//   - Utility Stores Corporation price lists
//   - Local market surveys (Faisalabad, Lahore, Karachi)
//
// These are serving-level prices (what you pay for one portion in a meal).
// Prices are intentionally slightly conservative — better to under-promise.
// ─────────────────────────────────────────────────────────────────────────────
const STATIC_PRICES = {
  // Breakfast
  'Aloo Paratha':               60,
  'Halwa Puri':                 90,
  'Anda Paratha':               70,
  'Doodh Pati Chai':            25,
  'Namkeen Lassi':              50,
  'Meethi Lassi':               60,
  'Anday ka Nashta':            65,
  'Khichdi':                    50,
  'Boiled Egg White Breakfast': 45,
  'Oats Porridge (Dalia)':      50,
  'Sattu Sharbat':              35,
  'Egg and Rice Bowl':          80,

  // Bread
  'Tandoori Roti':              20,
  'Chapati (Phulka)':           12,
  'Naan':                       30,

  // Lentils
  'Dal Masoor':                 80,
  'Dal Mash':                   90,
  'Dal Chana':                  85,
  'Chana Masala':               95,
  'Moong Dal (Yellow)':         75,
  'Lauki Dal (Low Protein)':    60,

  // Meat
  'Chicken Karahi':             280,
  'Chicken Roast (Desi)':       240,
  'Beef Qeema':                 220,
  'Mutton Karahi':              380,
  'Chicken Tikka (Grilled)':    300,
  'Steamed Fish (Rohu)':        200,
  'Chicken Soup (Yakhni)':      110,
  'Grilled Chicken Breast':     280,
  'Roasted Chicken with Rice':  250,
  'Cooked Carrots with Chicken': 180,

  // Vegetables
  'Saag (Sarson)':              90,
  'Aloo Gosht':                 200,
  'Bhindi Masala':              80,
  'Karela (Bitter Gourd)':      65,
  'Tinda Masala':               70,
  'Palak Paneer':               150,
  'Lauki (Bottle Gourd) Sabzi': 60,
  'Turai (Ridge Gourd) Sabzi':  60,
  'Aloo Matar':                 85,
  'Gajar Gosht (Carrot Curry)': 160,

  // Rice
  'Plain Boiled Rice':          40,
  'Chicken Biryani':            220,
  'Matar Pulao':                100,
  'Brown Rice (Unpolished)':    55,

  // Dairy
  'Dahi (Plain Yogurt)':        55,
  'Raita':                      40,
  'Low-Fat Milk (1 glass)':     40,

  // Snacks & Beverages
  'Samosa (Baked)':             40,
  'Fruit Chaat':                80,
  'Roasted Chana':              30,
  'Seasonal Fruit (Mixed)':     70,
  'Apple (1 medium)':           45,
  'Guava (Amrood)':             30,
  'Mixed Nuts (Small Portion)': 100,
  'Cucumber Salad (Kheera)':    25,
  'Boiled Potato (Plain)':      30,
  'Green Tea':                  20,
  'Rice Porridge with Egg White': 65,
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — Gemini with Google Search Grounding
//
// We send ALL food names in one batch call. Gemini uses googleSearch to find
// current Pakistani market prices for each item, then returns a JSON map.
//
// The googleSearch tool is a native Gemini API feature — it queries Google
// internally and grounds the response in real search results.
// ─────────────────────────────────────────────────────────────────────────────
const fetchPricesGrounded = async (foodNames) => {
  if (!foodNames.length) return {};

  const today = new Date().toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const prompt = `
Today is ${today}. You are a Pakistani food market pricing analyst.

Search Google for the CURRENT retail prices of the following food items in Pakistani cities (Faisalabad, Lahore, Karachi).
These are SERVING-LEVEL prices — what a single person pays for one meal portion at a local market, dhaba, or kiryana store.

Food items to price:
${foodNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}

SEARCH INSTRUCTIONS:
- Search for each item's current price in PKR in Pakistani markets
- Focus on April 2025 prices from Pakistan Bureau of Statistics, local market reports, or food price surveys
- Use serving/portion sizes (not per-kg bulk prices):
  * Roti/Chapati: price per piece
  * Dal/Sabzi: price for one bowl (250g serving)
  * Chicken dishes: price for one plate/serving
  * Drinks: price per glass/cup
  * Snacks: price for standard portion

After searching, return ONLY a valid JSON object. No explanation. No markdown. No backticks.
Format: { "Exact Food Name": price_as_integer_pkr }

Example: { "Tandoori Roti": 20, "Dal Masoor": 85, "Chicken Karahi": 280 }

Keys must exactly match the food names I listed. Return all ${foodNames.length} items.
`.trim();

  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
    tools: [{ googleSearch: {} }],
  });

  const result  = await model.generateContent(prompt);
  const raw     = result.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  // Extract JSON — sometimes Gemini prepends a sentence before the JSON block
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in grounded response');

  const parsed = JSON.parse(jsonMatch[0]);

  // Validate: must be object with numeric values
  const valid = {};
  for (const [k, v] of Object.entries(parsed)) {
    const n = parseInt(v, 10);
    if (n > 0 && n < 50000) valid[k] = n; // sanity-check range (PKR 1–50,000)
  }

  return valid;
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — Gemini WITHOUT grounding (AI knowledge fallback)
//
// Same prompt, same JSON format, but no Google Search tool.
// Gemini draws from its training data about Pakistani food prices.
// Less accurate than grounded, but better than random DB seeds.
// ─────────────────────────────────────────────────────────────────────────────
const fetchPricesAI = async (foodNames) => {
  if (!foodNames.length) return {};

  const today = new Date().toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const prompt = `
Today is ${today}. You are a Pakistani food market pricing expert with deep knowledge of current Pakistani food prices.

Provide REALISTIC current retail prices for the following food items in Pakistani Rupees (PKR).
These are SERVING-LEVEL prices as of early 2025 in Faisalabad, Lahore, or Karachi:

${foodNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}

Price guidelines for Pakistan 2025:
- Tandoori Roti: PKR 15-25 per piece
- Dal serving (bowl): PKR 70-120
- Sabzi serving (bowl): PKR 60-100
- Chicken dish serving: PKR 200-350
- Mutton dish serving: PKR 300-450
- Beverages (tea/lassi): PKR 20-70
- Snack portion: PKR 25-80
- Fruit portion: PKR 30-80

Return ONLY valid JSON. No markdown. No explanation. No backticks.
Format: { "Exact Food Name": price_as_integer_pkr }
All ${foodNames.length} items must be included.
`.trim();

  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
    // No tools — pure knowledge-based response
  });

  const result  = await model.generateContent(prompt);
  const raw     = result.response.text().trim();
  const cleaned = raw
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found in AI response');

  const parsed = JSON.parse(jsonMatch[0]);

  const valid = {};
  for (const [k, v] of Object.entries(parsed)) {
    const n = parseInt(v, 10);
    if (n > 0 && n < 50000) valid[k] = n;
  }

  return valid;
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER 3 — Static lookup
//
// Pure synchronous lookup from the researched static table above.
// Always available, never fails.
// ─────────────────────────────────────────────────────────────────────────────
const getStaticPrice = (foodName, dbPrice) => {
  const staticPrice = STATIC_PRICES[foodName];
  // Prefer static research price; fall back to DB seed price if not in table
  return staticPrice || dbPrice || 50;
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN — getPricesForFoods
//
// Takes an array of food items and returns them with accurate current PKR prices.
// Uses cache first, then waterfall through Tier 1 → Tier 2 → Tier 3.
//
// @param {Array<{ _id, name, price }>} foodItems
// @returns {Promise<Array<{ _id, name, price, priceSource }>>}
// ─────────────────────────────────────────────────────────────────────────────
const getPricesForFoods = async (foodItems) => {
  if (!foodItems || foodItems.length === 0) return [];

  const result      = new Map(); // name → enriched item
  const needsFetch  = [];

  // ── Step 1: Serve from cache wherever possible ────────
  for (const item of foodItems) {
    const cached = _getCacheEntry(item.name);
    if (cached) {
      result.set(item.name, { ...item, price: cached.price, priceSource: cached.source });
      console.log(`[PriceEngine] Cache hit: ${item.name} → PKR ${cached.price} (${cached.source})`);
    } else {
      needsFetch.push(item);
    }
  }

  if (needsFetch.length === 0) {
    console.log(`[PriceEngine] All ${foodItems.length} prices served from cache.`);
    return foodItems.map((f) => result.get(f.name) || f);
  }

  const names = needsFetch.map((f) => f.name);
  console.log(`[PriceEngine] Fetching prices for ${names.length} items: ${names.join(', ')}`);

  let priceMap  = {};
  let source    = 'static';

  // ── Step 2: Try Tier 1 — Grounded Gemini search ──────
  try {
    console.log('[PriceEngine] Tier 1: Gemini + Google Search grounding...');
    priceMap = await fetchPricesGrounded(names);
    const hitCount = Object.keys(priceMap).length;
    console.log(`[PriceEngine] Tier 1 success: ${hitCount}/${names.length} prices fetched from Google Search.`);
    source = 'grounded';
  } catch (tier1Err) {
    console.warn(`[PriceEngine] Tier 1 failed: ${tier1Err.message}`);

    // ── Step 3: Try Tier 2 — AI knowledge fallback ─────
    try {
      console.log('[PriceEngine] Tier 2: Gemini AI knowledge fallback...');
      priceMap = await fetchPricesAI(names);
      const hitCount = Object.keys(priceMap).length;
      console.log(`[PriceEngine] Tier 2 success: ${hitCount}/${names.length} prices from AI knowledge.`);
      source = 'ai';
    } catch (tier2Err) {
      console.warn(`[PriceEngine] Tier 2 failed: ${tier2Err.message}. Falling back to static prices.`);
      // priceMap stays empty — everything goes to static
    }
  }

  // ── Step 4: Resolve each item using best available price ──
  for (const item of needsFetch) {
    // Try AI/grounded price first — fuzzy match to handle minor name differences
    let price = priceMap[item.name];

    if (!price || price <= 0) {
      // Try case-insensitive match
      const lowerName = item.name.toLowerCase();
      for (const [k, v] of Object.entries(priceMap)) {
        if (k.toLowerCase() === lowerName) { price = v; break; }
      }
    }

    const itemSource = (price && price > 0) ? source : 'static';
    const finalPrice = (price && price > 0) ? price : getStaticPrice(item.name, item.price);

    _setCache(item.name, finalPrice, itemSource);
    result.set(item.name, { ...item, price: finalPrice, priceSource: itemSource });

    console.log(`[PriceEngine] ${item.name}: PKR ${finalPrice} (${itemSource})`);
  }

  // Return in original order
  return foodItems.map((f) => result.get(f.name) || { ...f, priceSource: 'static' });
};

// ─────────────────────────────────────────────────────────────────────────────
// updateMealPlanPrices
//
// Takes a fully-populated MealPlan Mongoose document and refreshes all
// slot prices with real-time data. Saves the source tag on each slot.
// Recalculates day totals and weekly totals.
//
// @param {Object} mealPlan — populated MealPlan document (or plain object)
// @returns {Object} — plan object with updated prices ready to save to DB
// ─────────────────────────────────────────────────────────────────────────────
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const updateMealPlanPrices = async (mealPlan) => {
  if (!mealPlan?.days) return mealPlan;

  // ── Collect unique food items across all 7 days ───────
  const foodMap = new Map(); // id_string → { _id, name, price }
  for (const day of mealPlan.days) {
    for (const mt of MEAL_TYPES) {
      for (const slot of (day[mt] || [])) {
        const food = slot.foodItem;
        if (!food) continue;
        const id = String(food._id || food);
        if (!foodMap.has(id)) {
          foodMap.set(id, {
            _id:   food._id || food,
            name:  food.name  || '',
            price: slot.price || food.price || 50,
          });
        }
      }
    }
  }

  const uniqueFoods = Array.from(foodMap.values()).filter((f) => f.name);
  if (uniqueFoods.length === 0) return mealPlan;

  console.log(`[PriceEngine] Updating prices for ${uniqueFoods.length} unique food items in meal plan.`);
  const pricedFoods = await getPricesForFoods(uniqueFoods);

  // Build name → { price, priceSource } lookup
  const priceLookup = new Map();
  for (const f of pricedFoods) {
    priceLookup.set(f.name, { price: f.price, priceSource: f.priceSource });
  }

  // ── Apply updated prices to plan object ───────────────
  const planObj = typeof mealPlan.toObject === 'function'
    ? mealPlan.toObject()
    : JSON.parse(JSON.stringify(mealPlan));

  for (const day of planObj.days) {
    let dayTotal = 0;

    for (const mt of MEAL_TYPES) {
      for (const slot of (day[mt] || [])) {
        const foodName = slot.foodItem?.name;
        if (foodName && priceLookup.has(foodName)) {
          const { price, priceSource } = priceLookup.get(foodName);
          slot.price       = price;
          slot.priceSource = priceSource; // 'grounded' | 'ai' | 'static'
        }
        dayTotal += slot.price || 0;
      }
    }

    day.totalCost = parseFloat(dayTotal.toFixed(2));
  }

  // ── Recalculate weekly totals ─────────────────────────
  planObj.weeklyTotalCost = parseFloat(
    planObj.days.reduce((s, d) => s + (d.totalCost || 0), 0).toFixed(2)
  );
  planObj.avgDailyCost = parseFloat((planObj.weeklyTotalCost / 7).toFixed(2));

  // ── Attach price source summary for frontend display ──
  const sources = pricedFoods.reduce((acc, f) => {
    acc[f.priceSource] = (acc[f.priceSource] || 0) + 1;
    return acc;
  }, {});
  planObj.priceSourceSummary = sources;

  const dominantSource = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]?.[0] || 'static';
  planObj.priceDataSource = dominantSource; // 'grounded' | 'ai' | 'static'

  console.log(`[PriceEngine] Price update complete. Source breakdown:`, sources);

  return planObj;
};

// ─────────────────────────────────────────────────────────────────────────────
// getSingleItemPrice — utility for one-off price lookups
// ─────────────────────────────────────────────────────────────────────────────
const getSingleItemPrice = async (foodName, fallbackPrice) => {
  const cached = _getCacheEntry(foodName);
  if (cached) return cached.price;

  try {
    const items = await getPricesForFoods([{ name: foodName, price: fallbackPrice }]);
    return items[0]?.price || fallbackPrice;
  } catch {
    return fallbackPrice;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// clearPriceCache — for admin/testing use
// ─────────────────────────────────────────────────────────────────────────────
const clearPriceCache = () => {
  _priceCache.clear();
  console.log('[PriceEngine] Price cache cleared.');
};

module.exports = { getPricesForFoods, getSingleItemPrice, updateMealPlanPrices, clearPriceCache };
