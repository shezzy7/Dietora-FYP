// src/services/priceUpdater.service.js
// DIETORA — Real-Time Pakistani Food Price Engine
//
// Uses @google/genai (NEW SDK) with proper Google Search grounding.
// Old @google/generative-ai had broken grounding for Gemini 2.5.
//
// Flow:
//   1. Check in-memory cache (4hr TTL for grounded, 24hr for static)
//   2. Tier 1: @google/genai → Gemini 2.5 Flash + Google Search grounding
//      → verify response has groundingMetadata (proof it actually searched)
//      → run price guard to reject out-of-range values
//   3. Tier 2: static baseline (April 2026 Faisalabad research)
//      → only used if Tier 1 completely fails OR guard rejects the price

'use strict';

const { GoogleGenAI } = require('@google/genai');

// ─── Client (lazy singleton, new SDK) ─────────────────────
let _ai = null;
const getClient = () => {
  if (!_ai) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing from .env');
    _ai = new GoogleGenAI({ apiKey: key });
  }
  return _ai;
};

// ─── In-memory price cache ─────────────────────────────────
const _cache = new Map();
const TTL_GROUNDED = 4  * 60 * 60 * 1000;
const TTL_STATIC   = 24 * 60 * 60 * 1000;

const getCached = (name) => {
  const e = _cache.get(name);
  if (!e) return null;
  const ttl = e.source === 'grounded' ? TTL_GROUNDED : TTL_STATIC;
  return Date.now() - e.at < ttl ? e : null;
};
const setCache = (name, price, source) =>
  _cache.set(name, { price, source, at: Date.now() });

// ─────────────────────────────────────────────────────────────────────────────
// STATIC BASELINE (April 2026 Faisalabad, dhaba serving-level prices)
// Source: UrduPoint daily market rates, chickenratetoday.pk, local survey
// ─────────────────────────────────────────────────────────────────────────────
const STATIC = {
  'Aloo Paratha': 130, 'Halwa Puri': 150, 'Anda Paratha': 140,
  'Doodh Pati Chai': 30, 'Namkeen Lassi': 70, 'Meethi Lassi': 80,
  'Anday ka Nashta': 90, 'Khichdi': 70, 'Boiled Egg White Breakfast': 60,
  'Oats Porridge (Dalia)': 60, 'Sattu Sharbat': 40, 'Nihari with Naan': 250,
  'Paye (Trotters Soup)': 180,
  'Tandoori Roti': 25, 'Chapati (Phulka)': 15, 'Naan': 40,
  'Paratha (Plain)': 50, 'Missi Roti': 25, 'Bajra Roti': 20,
  'Dal Masoor': 100, 'Dal Mash': 120, 'Dal Chana': 110,
  'Chana Masala': 120, 'Moong Dal (Yellow)': 95, 'Kala Chana': 110,
  'Dal Makhani': 140, 'Lauki Dal (Low Protein)': 85,
  'Chicken Karahi': 420, 'Chicken Roast (Desi)': 380, 'Beef Qeema': 320,
  'Mutton Karahi': 550, 'Chicken Tikka (Grilled)': 400,
  'Steamed Fish (Rohu)': 280, 'Chicken Soup (Yakhni)': 150,
  'Grilled Chicken Breast': 350, 'Chapli Kebab': 200, 'Seekh Kebab': 180,
  'Beef Nihari': 280, 'Aloo Gosht': 270, 'Karahi Gosht': 580,
  'Shami Kebab': 150, 'Chicken Korma': 400, 'Liver (Kaleji) Masala': 200,
  'Fish Karahi (Machli)': 360, 'Aloo Keema': 260, 'Kadu (Pumpkin) Gosht': 250,
  'Shaljam Gosht': 230,
  'Saag (Sarson ka)': 120, 'Bhindi Masala': 90, 'Karela (Bitter Gourd)': 85,
  'Tinda Masala': 85, 'Palak Sabzi (Spinach)': 90,
  'Lauki (Bottle Gourd) Sabzi': 80, 'Turai (Ridge Gourd) Sabzi': 80,
  'Aloo Matar': 100, 'Baingan Bharta': 95, 'Gobi Masala (Cauliflower)': 90,
  'Aloo Gobi': 100, 'Palak Paneer': 180, 'Methi (Fenugreek) Sabzi': 90,
  'Arvi (Taro Root) Masala': 90, 'Band Gobi (Cabbage) Sabzi': 75,
  'Plain Boiled Rice': 60, 'Chicken Biryani': 280, 'Mutton Biryani': 380,
  'Matar Pulao': 130, 'Brown Rice (Unpolished)': 75, 'Yakhni Pulao': 220,
  'Dahi (Plain Yogurt)': 70, 'Raita': 55, 'Low-Fat Milk (1 glass)': 55,
  'Paneer (Cottage Cheese)': 150,
  'Samosa (Baked)': 60, 'Fruit Chaat': 100, 'Roasted Chana': 40,
  'Cucumber Salad (Kheera)': 35, 'Green Tea': 30, 'Pakora (Besan)': 70,
  'Gol Gappa (Pani Puri)': 50, 'Chana Chaat': 90, 'Mixed Nuts (Small Portion)': 120,
  'Apple (1 medium)': 60, 'Guava (Amrood)': 40, 'Banana': 30,
  'Papaya (Papita)': 50, 'Mango (Aam)': 100, 'Kinnow (Citrus)': 40,
  'Watermelon (Tarbooz)': 40, 'Pomegranate (Anar)': 120, 'Dates (Khajoor)': 130,
  'Grapes (Angoor)': 90, 'Pear (Naashpati)': 60, 'Strawberry (Strawberry)': 110,
  'Gajar Halwa': 110, 'Kheer (Rice Pudding)': 100,
  'Sewaiyan (Vermicelli Pudding)': 90, 'Zarda (Sweet Rice)': 110,
  'Rice Porridge with Egg White': 80,
};

const staticPrice = (name, dbPrice) => STATIC[name] ?? dbPrice ?? 80;

// ─── Per-category price guards ────────────────────────────
const GUARDS = {
  roti:    [15,  90],
  daal:    [75, 220],
  chicken: [280, 750],
  mutton:  [380, 950],
  beef:    [220, 650],
  fish:    [180, 550],
  sabzi:   [60, 250],
  rice:    [50, 500],
  dairy:   [35, 220],
  drink:   [20, 160],
  snack:   [25, 220],
  fruit:   [20, 160],
  dessert: [70, 220],
  default: [25, 900],
};

const guard = (name) => {
  const n = name.toLowerCase();
  if (/roti|chapati|naan|paratha/.test(n))              return GUARDS.roti;
  if (/\bdal\b|\bdaal\b|chana masala|kala chana/.test(n)) return GUARDS.daal;
  if (/chicken/.test(n))                                return GUARDS.chicken;
  if (/mutton|karahi gosht/.test(n))                    return GUARDS.mutton;
  if (/beef|qeema|nihari|kaleji/.test(n))               return GUARDS.beef;
  if (/fish|machli|rohu/.test(n))                       return GUARDS.fish;
  if (/sabzi|saag|bhindi|karela|tinda|lauki|turai|palak|baingan|gobi|methi|arvi|band gobi/.test(n)) return GUARDS.sabzi;
  if (/rice|pulao|biryani|khichdi/.test(n))             return GUARDS.rice;
  if (/milk|dahi|yogurt|raita|paneer|lassi/.test(n))    return GUARDS.dairy;
  if (/chai|tea|sharbat|lassi|drink/.test(n))           return GUARDS.drink;
  if (/samosa|pakora|chaat|kebab|chana|nuts|gappa|cucumber/.test(n)) return GUARDS.snack;
  if (/apple|guava|banana|papaya|mango|kinnow|tarbooz|anar|khajoor|grape|pear|strawberry/.test(n)) return GUARDS.fruit;
  if (/halwa|kheer|sewaiyan|zarda/.test(n))             return GUARDS.dessert;
  return GUARDS.default;
};

const validPrice = (name, price) => {
  const [min, max] = guard(name);
  return Number.isFinite(price) && price >= min && price <= max;
};

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — New SDK (@google/genai) with verified Google Search grounding
// ─────────────────────────────────────────────────────────────────────────────
const fetchGrounded = async (foodNames) => {
  const today = new Date().toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const prompt = `Today is ${today}. You are a Pakistani food market analyst in Faisalabad.

Search Google for CURRENT prices of these food items. Return ONE integer PKR price per item.

CRITICAL: These are DHABA/HOME COOKING SERVING PRICES — what 1 person pays for 1 portion.
NOT per-kg rates. NOT per-maund. NOT restaurant prices. NOT wholesale.

Serving size guide:
- Roti/Naan/Paratha = price per single piece (NOT per dozen)
- Dal/Sabzi = price per bowl 250g (NOT per kg)
- Chicken Karahi = price for 1-person serving ~300g (NOT full handi)
- Mutton Karahi = price for 1-person serving ~300g (NOT full handi)  
- Biryani/Pulao = price per plate ~350g
- Drinks/Lassi = price per glass/cup
- Fruit = price per piece or per small serving

Search for: "Faisalabad food prices April 2026 dhaba"

Return ONLY a JSON object, no markdown, no explanation:
{ "Food Name": <integer_pkr_price> }

Items:
${foodNames.map((n, i) => `${i + 1}. ${n}`).join('\n')}`;

  const ai = getClient();

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.05,
      maxOutputTokens: 2048,
    },
  });

  // ── Verify grounding actually happened ────────────────────
  const meta = response.candidates?.[0]?.groundingMetadata;
  const queries = meta?.webSearchQueries || [];
  if (queries.length === 0) {
    throw new Error('Gemini did not perform any Google Search queries — grounding failed silently');
  }
  console.log(`[PriceEngine] Google Search queries used: ${queries.join(' | ')}`);

  const raw     = response.text;
  const cleaned = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();
  const match   = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`No JSON in grounded response. Raw: ${cleaned.slice(0, 200)}`);

  const parsed = JSON.parse(match[0]);

  // ── Apply price guards ────────────────────────────────────
  const valid = {};
  for (const [k, v] of Object.entries(parsed)) {
    const n = parseInt(v, 10);
    if (validPrice(k, n)) {
      valid[k] = n;
    } else {
      const [min, max] = guard(k);
      console.warn(`[PriceEngine] Guard REJECTED: "${k}" → PKR ${n}  (allowed: ${min}–${max})`);
    }
  }

  const hitRate = Object.keys(valid).length;
  console.log(`[PriceEngine] Guard passed: ${hitRate}/${foodNames.length} items`);

  if (hitRate === 0) {
    throw new Error('All prices rejected by guard — response was not serving-level prices');
  }

  return valid;
};

// ─────────────────────────────────────────────────────────────────────────────
// getPricesForFoods — core pricing function
// ─────────────────────────────────────────────────────────────────────────────
const getPricesForFoods = async (foodItems) => {
  if (!foodItems?.length) return [];

  const result     = new Map();
  const needsFetch = [];

  // Serve from cache
  for (const item of foodItems) {
    const hit = getCached(item.name);
    if (hit) {
      result.set(item.name, { ...item, price: hit.price, priceSource: hit.source });
      console.log(`[PriceEngine] Cache HIT: ${item.name} → PKR ${hit.price} (${hit.source})`);
    } else {
      needsFetch.push(item);
    }
  }

  if (!needsFetch.length) return foodItems.map((f) => result.get(f.name) || f);

  const names = needsFetch.map((f) => f.name);
  console.log(`\n[PriceEngine] ── Fetching live prices for ${names.length} items ──`);

  let groundedMap = {};
  let groundingWorked = false;

  // Tier 1: New SDK + verified Google Search
  try {
    groundedMap     = await fetchGrounded(names);
    groundingWorked = true;
    console.log(`[PriceEngine] ✅ Grounding SUCCESS — ${Object.keys(groundedMap).length} prices from live Google Search`);
  } catch (err) {
    console.error(`[PriceEngine] ❌ Grounding FAILED: ${err.message}`);
    console.log('[PriceEngine] → Falling back to static prices for unresolved items');
  }

  // Resolve each item
  for (const item of needsFetch) {
    // Try exact match from grounded response
    let livePrice = groundedMap[item.name];

    // Try case-insensitive match
    if (!livePrice) {
      const lower = item.name.toLowerCase();
      for (const [k, v] of Object.entries(groundedMap)) {
        if (k.toLowerCase() === lower) { livePrice = v; break; }
      }
    }

    const useGrounded  = groundingWorked && livePrice && validPrice(item.name, livePrice);
    const finalPrice   = useGrounded ? livePrice : staticPrice(item.name, item.price);
    const finalSource  = useGrounded ? 'grounded' : 'static';

    setCache(item.name, finalPrice, finalSource);
    result.set(item.name, { ...item, price: finalPrice, priceSource: finalSource });
    console.log(`[PriceEngine] ${useGrounded ? '🌐' : '📊'} ${item.name}: PKR ${finalPrice} (${finalSource})`);
  }

  return foodItems.map((f) => result.get(f.name) || { ...f, priceSource: 'static' });
};

// ─────────────────────────────────────────────────────────────────────────────
// updateMealPlanPrices — updates all meal slot prices on a populated MealPlan
// ─────────────────────────────────────────────────────────────────────────────
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

const updateMealPlanPrices = async (mealPlan) => {
  if (!mealPlan?.days) return mealPlan;

  const foodMap = new Map();
  for (const day of mealPlan.days) {
    for (const mt of MEAL_TYPES) {
      for (const slot of (day[mt] || [])) {
        const food = slot.foodItem;
        if (!food) continue;
        const id = String(food._id || food);
        if (!foodMap.has(id)) {
          foodMap.set(id, { _id: food._id || food, name: food.name || '', price: slot.price || food.price || 80 });
        }
      }
    }
  }

  const uniqueFoods = Array.from(foodMap.values()).filter((f) => f.name);
  if (!uniqueFoods.length) return mealPlan;

  console.log(`\n[PriceEngine] ══ Starting price update for ${uniqueFoods.length} unique items ══`);
  const pricedFoods = await getPricesForFoods(uniqueFoods);

  const lookup = new Map();
  for (const f of pricedFoods) lookup.set(f.name, { price: f.price, priceSource: f.priceSource });

  const planObj = typeof mealPlan.toObject === 'function'
    ? mealPlan.toObject()
    : JSON.parse(JSON.stringify(mealPlan));

  for (const day of planObj.days) {
    let dayTotal = 0;
    for (const mt of MEAL_TYPES) {
      for (const slot of (day[mt] || [])) {
        const name = slot.foodItem?.name;
        if (name && lookup.has(name)) {
          const { price, priceSource } = lookup.get(name);
          slot.price       = price;
          slot.priceSource = priceSource;
        }
        dayTotal += slot.price || 0;
      }
    }
    day.totalCost = parseFloat(dayTotal.toFixed(2));
  }

  planObj.weeklyTotalCost = parseFloat(planObj.days.reduce((s, d) => s + (d.totalCost || 0), 0).toFixed(2));
  planObj.avgDailyCost    = parseFloat((planObj.weeklyTotalCost / 7).toFixed(2));

  const sources = pricedFoods.reduce((acc, f) => {
    acc[f.priceSource] = (acc[f.priceSource] || 0) + 1;
    return acc;
  }, {});

  planObj.priceSourceSummary = sources;
  planObj.priceDataSource    = Object.entries(sources).sort((a, b) => b[1] - a[1])[0]?.[0] || 'static';

  const groundedCount = sources.grounded || 0;
  const staticCount   = sources.static   || 0;
  console.log(`\n[PriceEngine] ══ Done: 🌐 ${groundedCount} grounded | 📊 ${staticCount} static ══\n`);

  return planObj;
};

// ─── Utilities ─────────────────────────────────────────────
const getSingleItemPrice = async (foodName, fallbackPrice) => {
  const hit = getCached(foodName);
  if (hit) return hit.price;
  try {
    const items = await getPricesForFoods([{ name: foodName, price: fallbackPrice }]);
    return items[0]?.price || fallbackPrice;
  } catch {
    return fallbackPrice;
  }
};

const clearPriceCache = () => {
  _cache.clear();
  console.log('[PriceEngine] Cache cleared.');
};

module.exports = { getPricesForFoods, getSingleItemPrice, updateMealPlanPrices, clearPriceCache };
