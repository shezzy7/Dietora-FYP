// src/services/ai/chatbot/tools.js
// DIETORA Chatbot Tools — Tavily + Google Places + MongoDB
//
// 7 tools available to the LangGraph agent:
//   1. fetch_user_profile         → user's medical profile from MongoDB
//   2. fetch_active_meal_plan     → user's current meal plan
//   3. search_local_stores        → Google Places (real GPS-based)
//   4. search_who_health_guidance → Tavily, filtered to WHO + authoritative health orgs
//   5. get_pakistani_food_price   → Tavily, filtered to PK e-commerce sites (auto city from GPS)
//   6. tavily_general_search      → Tavily, general web search (fallback)
//   7. extract_url_content        → Tavily Extract (deep read of one URL)
//
// Design notes:
//   - Each tool has a STRICT description so the LLM picks the right one.
//   - All tools return JSON strings (LangGraph requirement).
//   - Errors are caught and returned as readable strings — never thrown to LLM.
//   - Tavily is shared via getTavilySearch() / getTavilyExtract() singletons.
//   - City for price queries is AUTO-DETECTED from locationContext (GPS-based).

const { DynamicStructuredTool } = require('@langchain/core/tools');
const { z } = require('zod');
const { TavilySearch, TavilyExtract } = require('@langchain/tavily');

const HealthProfile = require('../../../models/HealthProfile');
const MealPlan = require('../../../models/MealPlan');
const { searchStoresForFood, attachDistances } = require('../../places.service');

// ─── Tavily singletons (lazy) ─────────────────────────────────────────────
let _tavilySearch = null;
let _tavilyExtract = null;

const getTavilySearch = () => {
  if (_tavilySearch) return _tavilySearch;
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is missing from .env');
  }
  _tavilySearch = new TavilySearch({
    maxResults: 5,
    searchDepth: 'advanced',
    includeAnswer: true,
    includeRawContent: false,
    topic: 'general',
  });
  return _tavilySearch;
};

const getTavilyExtract = () => {
  if (_tavilyExtract) return _tavilyExtract;
  if (!process.env.TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY is missing from .env');
  }
  _tavilyExtract = new TavilyExtract({
    extractDepth: 'advanced',
    includeImages: false,
  });
  return _tavilyExtract;
};

// ─── Helper: extract city from locationContext (GPS-based) ────────────────
const extractCityFromContext = (locationContext) => {
  if (!locationContext) return null;
  return (
    locationContext.resolvedCity ||
    locationContext.resolvedArea ||
    locationContext.city ||
    null
  );
};

// ─── Authoritative health domains (whitelist for medical guidance) ────────
const HEALTH_DOMAINS = [
  'who.int',
  'cdc.gov',
  'nih.gov',
  'mayoclinic.org',
  'hopkinsmedicine.org',
  'medlineplus.gov',
  'nhs.uk',
  'heart.org',
  'diabetes.org',
];

// ─── Pakistani e-commerce / grocery domains (for price lookup) ────────────
const PK_PRICE_DOMAINS = [
  'daraz.pk',
  'foodpanda.pk',
  'naheed.pk',
  'metro-online.pk',
  'krave-mart.com',
  'panda-mart.pk',
  'hum-mart.com',
  'imtiaz.com.pk',
  'priceoye.pk',
  'darazpk.com',
];

// ─── Helper: safe JSON stringify (truncates if too large) ─────────────────
const safeStringify = (obj, maxLen = 4000) => {
  let s;
  try { s = JSON.stringify(obj); } catch { s = String(obj); }
  if (s.length > maxLen) {
    s = s.slice(0, maxLen) + '... [truncated]';
  }
  return s;
};

// ─── Helper: format Tavily results for LLM consumption ────────────────────
const formatTavilyResults = (raw) => {
  if (!raw) return { error: 'No results from Tavily' };

  let data = raw;
  if (typeof raw === 'string') {
    try { data = JSON.parse(raw); } catch { return { rawText: raw.slice(0, 2000) }; }
  }

  const formatted = {
    answer: data.answer || null,
    sources: (data.results || []).slice(0, 5).map((r) => ({
      title: r.title,
      url: r.url,
      snippet: (r.content || '').slice(0, 500),
      score: r.score,
    })),
  };
  return formatted;
};

// ──────────────────────────────────────────────────────────────────────────
//                            TOOL FACTORY
// ──────────────────────────────────────────────────────────────────────────
const createChatbotTools = (userId, locationContext) => {

  // ─── 1. Fetch user health profile ───────────────────────────────────────
  const fetchUserProfileTool = new DynamicStructuredTool({
    name: 'fetch_user_profile',
    description:
      'Fetches the current user\'s health profile from the database — including age, gender, BMI, medical conditions (diabetes, hypertension, cardiac, kidney, thyroid, anemia, obesity, constipation), allergies, daily budget (PKR), and weight goal. ' +
      'Call this BEFORE giving any personalized medical or dietary advice. Always call this if the user mentions "my", "I have", or asks about their own health.',
    schema: z.object({}),
    func: async () => {
      try {
        const profile = await HealthProfile.findOne({ user: userId }).lean();
        if (!profile) {
          return safeStringify({
            status: 'no_profile',
            message: 'User has not completed health profile setup. Advise them to complete onboarding first.',
          });
        }

        return safeStringify({
          status: 'ok',
          demographics: {
            age: profile.age,
            gender: profile.gender,
            heightCm: profile.height,
            weightKg: profile.weight,
            activityLevel: profile.activityLevel,
            goal: profile.goal,
          },
          healthMetrics: {
            bmi: profile.bmi,
            bmiCategory: profile.bmiCategory,
            bmr: profile.bmr,
            tdee: profile.tdee,
            dailyCalorieTarget: profile.dailyCalorieTarget,
          },
          medicalConditions: {
            isDiabetic: profile.isDiabetic,
            isHypertensive: profile.isHypertensive,
            isCardiac: profile.isCardiac,
            hasKidneyDisease: profile.hasKidneyDisease,
            hasThyroid: profile.hasThyroid,
            hasConstipation: profile.hasConstipation,
            hasAnemia: profile.hasAnemia,
            hasObesity: profile.hasObesity,
            description: profile.diseaseDescription || 'None reported',
          },
          allergies: profile.allergies?.length ? profile.allergies : ['None'],
          budget: {
            dailyPKR: profile.dailyBudget,
          },
        });
      } catch (err) {
        console.error('[Tool:fetch_user_profile] Error:', err.message);
        return safeStringify({ status: 'error', message: `Could not fetch profile: ${err.message}` });
      }
    },
  });

  // ─── 2. Fetch active meal plan ──────────────────────────────────────────
  const fetchActiveMealPlanTool = new DynamicStructuredTool({
    name: 'fetch_active_meal_plan',
    description:
      'Fetches the user\'s currently ACTIVE 7-day meal plan summary. Call this when the user asks about "my meal plan", "what should I eat today", "my diet plan", or "this week\'s meals".',
    schema: z.object({}),
    func: async () => {
      try {
        const plan = await MealPlan.findOne({ user: userId, status: 'active' })
          .select('title startDate endDate weeklyTotalCost avgDailyCost planConfig priceDataSource')
          .lean();

        if (!plan) {
          return safeStringify({
            status: 'no_plan',
            message: 'User has no active meal plan. Suggest they generate one from the Meal Plan page.',
          });
        }

        return safeStringify({
          status: 'ok',
          title: plan.title,
          startDate: plan.startDate,
          endDate: plan.endDate,
          weeklyTotalCost: plan.weeklyTotalCost,
          avgDailyCost: plan.avgDailyCost,
          planConfig: plan.planConfig,
          priceDataSource: plan.priceDataSource,
          note: 'Full daily breakdown is on the Meal Plan page in the app.',
        });
      } catch (err) {
        console.error('[Tool:fetch_active_meal_plan] Error:', err.message);
        return safeStringify({ status: 'error', message: `Could not fetch meal plan: ${err.message}` });
      }
    },
  });

  // ─── 3. Search local stores via Google Places ───────────────────────────
  const searchLocalStoresTool = new DynamicStructuredTool({
    name: 'search_local_stores',
    description:
      'Searches REAL physical stores near the user\'s GPS location using Google Places API. ' +
      'Use this when the user asks "where can I buy X", "kahan se milega", "nearest grocery store", or wants to physically purchase something. ' +
      'Returns store names, addresses, distances, ratings, and Google Maps links. ' +
      'Categories: meat, lentils, rice, bread, vegetables, dairy, fruits, snack, beverage, grocery.',
    schema: z.object({
      foodName: z.string().describe('The specific food item to buy (e.g., "chicken", "basmati rice", "milk").'),
      foodCategory: z
        .enum(['meat', 'lentils', 'rice', 'bread', 'vegetables', 'dairy', 'fruits', 'snack', 'beverage', 'grocery'])
        .describe('Best matching food category for the item.'),
    }),
    func: async ({ foodName, foodCategory }) => {
      if (!locationContext?.locationConsent || !locationContext?.currentLocation?.coordinates) {
        return safeStringify({
          status: 'no_location',
          message: 'User has not granted location access. Ask them to enable location in Settings or set their city manually.',
        });
      }

      const [longitude, latitude] = locationContext.currentLocation.coordinates;
      if (!latitude || !longitude || (latitude === 0 && longitude === 0)) {
        return safeStringify({
          status: 'invalid_location',
          message: 'Location coordinates are invalid. Ask user to refresh location.',
        });
      }

      try {
        const stores = await searchStoresForFood(foodCategory, foodName, latitude, longitude, 5000);
        if (!stores || stores.length === 0) {
          return safeStringify({
            status: 'no_stores',
            foodSearched: foodName,
            message: `No nearby stores found for ${foodName} within 5km.`,
          });
        }

        const withDist = attachDistances(stores, latitude, longitude).slice(0, 5);

        const formatted = withDist.map((s) => ({
          name: s.name,
          address: s.address,
          distance: s.distanceText,
          rating: s.rating ? `${s.rating}/5 (${s.totalRatings} reviews)` : 'No rating',
          status: s.isOpenNow === true ? 'Open now' : s.isOpenNow === false ? 'Closed' : 'Hours unknown',
          mapsLink: s.mapsLink,
          directionsLink: s.directionsLink,
        }));

        return safeStringify({
          status: 'ok',
          foodSearched: foodName,
          locationUsed: locationContext.resolvedArea || locationContext.resolvedCity || 'GPS coordinates',
          storesFound: formatted,
        });
      } catch (err) {
        console.error('[Tool:search_local_stores] Error:', err.message);
        return safeStringify({
          status: 'error',
          message: `Could not search stores: ${err.message}. The Google Places API key may be missing or invalid.`,
        });
      }
    },
  });

  // ─── 4. WHO health guidance via Tavily (domain-filtered) ────────────────
  const searchWhoHealthGuidanceTool = new DynamicStructuredTool({
    name: 'search_who_health_guidance',
    description:
      'Searches AUTHORITATIVE medical sources (World Health Organization, CDC, NIH, Mayo Clinic, Johns Hopkins, NHS, American Heart Association, American Diabetes Association) for evidence-based health, disease, and nutrition guidance. ' +
      'USE THIS for any question about: disease management, nutrition science, dietary recommendations, medical conditions, supplements, food safety, or any health claim that needs an authoritative source. ' +
      'Returns sources with URLs you MUST cite in your final answer. ' +
      'Always prefer this over general web search for medical questions.',
    schema: z.object({
      query: z
        .string()
        .describe('Specific medical/nutrition question (e.g., "diabetes type 2 dietary management", "WHO guidelines for hypertension salt intake").'),
    }),
    func: async ({ query }) => {
      try {
        const tool = getTavilySearch();
        const raw = await tool.invoke({
          query,
          includeDomains: HEALTH_DOMAINS,
          searchDepth: 'advanced',
        });
        const formatted = formatTavilyResults(raw);
        if (!formatted.sources || formatted.sources.length === 0) {
          return safeStringify({
            status: 'no_results',
            message: `No authoritative health sources found for "${query}". Try a more specific query or use tavily_general_search.`,
          });
        }
        return safeStringify({ status: 'ok', sourceType: 'authoritative_health', ...formatted });
      } catch (err) {
        console.error('[Tool:search_who_health_guidance] Error:', err.message);
        return safeStringify({ status: 'error', message: `Health search failed: ${err.message}` });
      }
    },
  });

  // ─── 5. Pakistani food prices via Tavily ────────────────────────────────
  // City is AUTO-DETECTED from user's GPS locationContext (no guessing by LLM).
  const autoCity = extractCityFromContext(locationContext);

  const getPakistaniFoodPriceTool = new DynamicStructuredTool({
    name: 'get_pakistani_food_price',
    description:
      'Fetches REAL-TIME current prices in PKR for grocery items, food, or ingredients in Pakistan from Pakistani e-commerce sites (Daraz, Foodpanda Mart, Naheed, Metro, Krave Mart, Imtiaz, etc). ' +
      'USE THIS when the user asks "what is the price of X", "X ka rate kya hai", "X kitne ka mil raha hai", or wants to compare prices. ' +
      `Returns synthesized price information with source URLs. User's GPS-detected city: ${autoCity || 'unknown — will use general Pakistan'}.`,
    schema: z.object({
      itemName: z
        .string()
        .describe('The grocery/food item to look up (e.g., "basmati rice 5kg", "chicken per kg", "olive oil", "fresh milk 1 litre").'),
      city: z
        .string()
        .optional()
        .describe(`Pakistani city for price search. The GPS-detected city is "${autoCity || 'unknown'}". Only override this if the user explicitly asks about a different city.`),
    }),
    func: async ({ itemName, city }) => {
      // GPS-detected city always takes priority. Agent-supplied city only used as last resort.
      const effectiveCity = autoCity || city || null;
      try {
        const tool = getTavilySearch();
        const cityPart = effectiveCity ? ` in ${effectiveCity}` : ' Pakistan';
        const query = `${itemName} price${cityPart} current rate PKR`;

        console.log(`[Tool:get_pakistani_food_price] Searching: "${query}" | city: ${effectiveCity || 'general Pakistan'}`);

        const raw = await tool.invoke({
          query,
          includeDomains: PK_PRICE_DOMAINS,
          searchDepth: 'advanced',
          timeRange: 'month',
        });

        const formatted = formatTavilyResults(raw);
        if (!formatted.sources || formatted.sources.length === 0) {
          // Fallback: broader search without domain filter
          const rawFallback = await tool.invoke({
            query: `${itemName} price ${effectiveCity || 'Pakistan'} 2026`,
            searchDepth: 'advanced',
            timeRange: 'month',
          });
          const fallbackFormatted = formatTavilyResults(rawFallback);
          return safeStringify({
            status: 'fallback_used',
            sourceType: 'general_web',
            cityUsed: effectiveCity || 'Pakistan',
            note: 'No results from Pakistani e-commerce sites; showing general web results.',
            ...fallbackFormatted,
          });
        }

        return safeStringify({
          status: 'ok',
          sourceType: 'pk_ecommerce',
          itemSearched: itemName,
          cityUsed: effectiveCity || 'Pakistan',
          ...formatted,
        });
      } catch (err) {
        console.error('[Tool:get_pakistani_food_price] Error:', err.message);
        return safeStringify({ status: 'error', message: `Price lookup failed: ${err.message}` });
      }
    },
  });

  // ─── 6. General Tavily web search (fallback) ────────────────────────────
  const tavilyGeneralSearchTool = new DynamicStructuredTool({
    name: 'tavily_general_search',
    description:
      'General web search via Tavily — use ONLY when no other specialized tool fits. ' +
      'Examples: news, recipes, restaurant reviews, general nutrition facts, food trends. ' +
      'Do NOT use for medical guidance (use search_who_health_guidance) or Pakistani prices (use get_pakistani_food_price).',
    schema: z.object({
      query: z.string().describe('The search query.'),
    }),
    func: async ({ query }) => {
      try {
        const tool = getTavilySearch();
        const raw = await tool.invoke({ query, searchDepth: 'basic' });
        const formatted = formatTavilyResults(raw);
        return safeStringify({ status: 'ok', sourceType: 'general_web', ...formatted });
      } catch (err) {
        console.error('[Tool:tavily_general_search] Error:', err.message);
        return safeStringify({ status: 'error', message: `Search failed: ${err.message}` });
      }
    },
  });

  // ─── 7. Extract full content from a specific URL ────────────────────────
  const extractUrlContentTool = new DynamicStructuredTool({
    name: 'extract_url_content',
    description:
      'Extracts the FULL clean content from a specific URL. Use this when a previous search returned a promising URL and you need the complete article text — for example, a WHO fact sheet, Mayo Clinic disease page, or a detailed product page. ' +
      'Pass only ONE URL at a time.',
    schema: z.object({
      url: z.string().describe('The full URL to extract content from (must include https://).'),
    }),
    func: async ({ url }) => {
      try {
        if (!/^https?:\/\//i.test(url)) {
          return safeStringify({ status: 'error', message: 'URL must start with http:// or https://' });
        }
        const tool = getTavilyExtract();
        const raw = await tool.invoke({ urls: [url] });

        let data = raw;
        if (typeof raw === 'string') {
          try { data = JSON.parse(raw); } catch { /* keep as string */ }
        }

        const result = data.results?.[0];
        if (!result) {
          return safeStringify({ status: 'no_content', message: 'Could not extract content from URL.' });
        }

        const content = (result.raw_content || result.content || '').slice(0, 3500);
        return safeStringify({
          status: 'ok',
          url: result.url,
          content,
          truncated: (result.raw_content || '').length > 3500,
        });
      } catch (err) {
        console.error('[Tool:extract_url_content] Error:', err.message);
        return safeStringify({ status: 'error', message: `Extraction failed: ${err.message}` });
      }
    },
  });

  return [
    fetchUserProfileTool,
    fetchActiveMealPlanTool,
    searchLocalStoresTool,
    searchWhoHealthGuidanceTool,
    getPakistaniFoodPriceTool,
    tavilyGeneralSearchTool,
    extractUrlContentTool,
  ];
};

module.exports = { createChatbotTools };
