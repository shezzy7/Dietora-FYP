// src/services/chatbot.service.js
// Rule-based chatbot for DIETORA — with location-aware "where to buy" support

const { findStoresForFoodItem, findStoresByCity, getUserLocation } = require('./location.service');

const responses = {
  greet: [
    'Assalam-o-Alaikum! I am DIETORA Assistant 🥗. How can I help you today?',
    'Hello! Welcome to DIETORA. Ask me about your diet, meals, health, or where to buy ingredients!',
  ],
  bmi: [
    'BMI = weight(kg) / height(m)². DIETORA calculates this automatically from your health profile!',
    'A healthy BMI is between 18.5 and 24.9. Check your profile summary for your current BMI.',
  ],
  bmr: [
    'BMR (Basal Metabolic Rate) is calories your body needs at rest. DIETORA uses the Mifflin-St Jeor formula.',
    'Male BMR = (10×weight) + (6.25×height) − (5×age) + 5. DIETORA calculates it automatically!',
  ],
  calories: [
    'Your daily calorie target is based on BMR, activity level, and goal (loss/gain/maintenance).',
    'For weight loss, DIETORA sets a 500 kcal/day deficit. For weight gain, +500 kcal/day.',
  ],
  diabetes: [
    'DIETORA filters diabetic-safe foods — low glycemic index, low sugar. Enable the diabetic flag in your profile!',
    'Good diabetic foods: karela, bhindi, dal masoor, roasted chana, dahi.',
  ],
  hypertension: [
    'For hypertension, DIETORA recommends low-sodium foods. Enable the hypertension flag in your profile.',
    'Avoid pickles and processed foods. Eat more spinach (saag), tomatoes, and bananas.',
  ],
  cardiac: [
    'For cardiac health, DIETORA recommends low-fat, low-cholesterol foods.',
    'Heart-healthy choices: grilled chicken tikka, bhindi, saag, dahi, and fruit.',
  ],
  budget: [
    'DIETORA optimizes your meal plan to fit within your daily PKR budget.',
    'Update your budget in your health profile and regenerate the meal plan anytime!',
  ],
  mealPlan: [
    'Your AI-generated 7-day meal plan includes breakfast, lunch, dinner, and snacks — within your calorie and budget targets.',
    'Go to Meal Plan page to generate your personalized plan. It considers your diseases, allergies, and budget!',
  ],
  grocery: [
    'DIETORA auto-generates a grocery list from your meal plan. Visit the Grocery page after generating your plan.',
    'Your grocery list shows all weekly ingredients with estimated PKR prices!',
  ],
  pakistani: [
    'DIETORA includes 35+ authentic Pakistani foods: dal, roti, karahi, saag, pulao, biryani, and more 🍛',
    'All food prices reflect local Faisalabad market rates in PKR.',
  ],
  protein: [
    'Good Pakistani protein sources: chicken, dal masoor, dahi, eggs, chana. Aim for 0.8-1.8g per kg of body weight.',
    'Protein helps build muscle. DIETORA tracks your daily protein in the meal plan.',
  ],
  water: [
    'Drink 8-10 glasses (2-2.5 litres) of water daily. Hydration aids digestion and metabolism!',
    'Proper hydration helps with weight management and energy levels.',
  ],
  exercise: [
    'DIETORA accounts for your activity level in calorie calculations. More active = more calories allowed!',
    'Combine your DIETORA plan with 30 minutes of daily walking for best results.',
  ],
  location: [
    'DIETORA uses your location to find nearby grocery stores and marts in Pakistan! 📍',
    'Enable location access so I can tell you exactly where to buy your groceries near you.',
  ],
  store: [
    'I can find nearby stores for you! Just ask "Where can I buy dal?" or "Where to buy chicken near me?"',
    'DIETORA knows stores across Faisalabad, Lahore, Karachi, Islamabad, Multan, and more Pakistani cities!',
  ],
  help: [
    'I can help with: BMI, BMR, calories, diabetes/hypertension/cardiac diet, meal plans, grocery lists, Pakistani foods, protein, and finding stores near you! 🥗',
  ],
  default: [
    "I'm not sure about that. Try asking about your diet plan, calories, BMI, or where to buy ingredients! 😊",
    "You can ask about meal plans, health conditions, nutrition, or say 'Where can I buy chicken near me?'",
  ],
};

// ─── Food keyword → food category mapping ─────────────────
const foodKeywordMap = {
  // Lentils
  'dal': 'lentils', 'lentil': 'lentils', 'masoor': 'lentils', 'mash': 'lentils',
  'chana': 'lentils', 'moong': 'lentils', 'daal': 'lentils',
  // Meat
  'chicken': 'meat', 'murgh': 'meat', 'beef': 'meat', 'gosht': 'meat',
  'mutton': 'meat', 'fish': 'meat', 'machli': 'meat', 'qeema': 'meat',
  'karahi': 'meat', 'tikka': 'meat',
  // Vegetables
  'sabzi': 'vegetables', 'vegetable': 'vegetables', 'bhindi': 'vegetables',
  'aloo': 'vegetables', 'potato': 'vegetables', 'palak': 'vegetables',
  'spinach': 'vegetables', 'saag': 'vegetables', 'tamatar': 'vegetables',
  'tomato': 'vegetables', 'pyaz': 'vegetables', 'onion': 'vegetables',
  'karela': 'vegetables', 'tinda': 'vegetables', 'gobi': 'vegetables',
  // Dairy
  'dahi': 'dairy', 'yogurt': 'dairy', 'milk': 'dairy', 'doodh': 'dairy',
  'paneer': 'dairy', 'makhan': 'dairy', 'butter': 'dairy', 'cheese': 'dairy',
  'lassi': 'dairy',
  // Rice
  'chawal': 'rice', 'rice': 'rice', 'biryani': 'rice', 'pulao': 'rice',
  'basmati': 'rice',
  // Bread
  'roti': 'bread', 'naan': 'bread', 'paratha': 'bread', 'bread': 'bread',
  'atta': 'bread', 'flour': 'bread', 'maida': 'bread',
  // Fruits
  'fruit': 'fruits', 'phal': 'fruits', 'banana': 'fruits', 'kela': 'fruits',
  'apple': 'fruits', 'seb': 'fruits', 'mango': 'fruits', 'aam': 'fruits',
  'guava': 'fruits', 'amrood': 'fruits',
  // Snacks
  'namkeen': 'snack', 'biscuit': 'snack', 'snack': 'snack',
};

/**
 * detectIntent — enhanced with location & buy intents
 */
const detectIntent = (message) => {
  const msg = message.toLowerCase();

  // "Where can I buy X" / "where to buy" / "kahan milega" / "store near me"
  if (/where.*(buy|get|find|purchase|milega|milta|kahan)|store.*near|nearby.*store|shop.*near|kahan se|kahan mil/.test(msg)) {
    return 'whereToBuy';
  }
  // Location & store generic
  if (/location|gps|near me|nearby|store|mart|shop|grocery shop|kiryana/.test(msg)) return 'store';
  if (/enable location|share location|allow location/.test(msg)) return 'location';

  if (/hello|hi|salam|assalam|hey/.test(msg)) return 'greet';
  if (/bmi|body mass/.test(msg)) return 'bmi';
  if (/bmr|basal|metabolic rate/.test(msg)) return 'bmr';
  if (/calori|tdee|energy/.test(msg)) return 'calories';
  if (/diabet|sugar|glucose/.test(msg)) return 'diabetes';
  if (/hypertens|blood pressure|bp/.test(msg)) return 'hypertension';
  if (/cardiac|heart|cholesterol/.test(msg)) return 'cardiac';
  if (/budget|pkr|price|cost|rupee/.test(msg)) return 'budget';
  if (/meal plan|diet plan|7.day|seven day|generate plan/.test(msg)) return 'mealPlan';
  if (/grocery|shopping|list|ingredient/.test(msg)) return 'grocery';
  if (/pakistan|karahi|dal|roti|biryani|saag|pulao|desi/.test(msg)) return 'pakistani';
  if (/protein|muscle|amino/.test(msg)) return 'protein';
  if (/water|hydrat|drink/.test(msg)) return 'water';
  if (/exercise|workout|gym|active/.test(msg)) return 'exercise';
  if (/help|what can|how to|guide/.test(msg)) return 'help';

  return 'default';
};

/**
 * extractFoodFromMessage
 * Scans the message for known food keywords and returns the category
 */
const extractFoodFromMessage = (message) => {
  const msg = message.toLowerCase();
  for (const [keyword, category] of Object.entries(foodKeywordMap)) {
    if (msg.includes(keyword)) {
      return { keyword, category };
    }
  }
  return null;
};

/**
 * getWhereToBuyResponse
 * Async handler — queries DB for stores near user
 */
const getWhereToBuyResponse = async (message, userId) => {
  const food = extractFoodFromMessage(message);

  if (!food) {
    return {
      intent: 'whereToBuy',
      reply: "I couldn't identify the food item. Try asking: 'Where can I buy chicken?' or 'Where to find dal near me?'",
      suggestions: ['Where can I buy chicken?', 'Where to find dal?', 'Nearest grocery store'],
      stores: [],
    };
  }

  try {
    // Get user's saved location
    const userLoc = await getUserLocation(userId);

    let stores = [];
    let locationNote = '';

    if (userLoc && userLoc.locationConsent) {
      const [lon, lat] = userLoc.currentLocation.coordinates;
      stores = await findStoresForFoodItem(food.category, lon, lat, 10);
      locationNote = userLoc.resolvedArea
        ? ` near ${userLoc.resolvedArea}`
        : userLoc.resolvedCity
        ? ` in ${userLoc.resolvedCity}`
        : '';
    } else if (userLoc && userLoc.manualCity) {
      stores = await findStoresByCity(userLoc.manualCity, { category: food.category });
      locationNote = ` in ${userLoc.manualCity}`;
    }

    if (stores.length === 0) {
      return {
        intent: 'whereToBuy',
        reply: `I couldn't find stores carrying ${food.keyword}${locationNote}. Please enable location access or set your city in Settings so I can find stores near you! 📍`,
        suggestions: ['Enable location', 'Set my city', 'Nearby stores'],
        requiresLocation: true,
        stores: [],
      };
    }

    // Format top 3 stores for display
    const topStores = stores.slice(0, 3);
    const storeList = topStores
      .map((s, i) => `${i + 1}. ${s.name} — ${s.address?.area || s.address?.city}${s.distanceText ? ' (' + s.distanceText + ')' : ''}${s.hasHomeDelivery ? ' 🚚' : ''}`)
      .join('\n');

    const reply = `You can buy **${food.keyword}**${locationNote} at:\n\n${storeList}\n\n${
      stores.length > 3 ? `...and ${stores.length - 3} more stores nearby!` : ''
    }${topStores.some((s) => s.hasHomeDelivery) ? '\n\n🚚 Stores marked with 🚚 offer home delivery!' : ''}`;

    return {
      intent: 'whereToBuy',
      reply,
      foodKeyword: food.keyword,
      foodCategory: food.category,
      stores: topStores.map((s) => ({
        id: s._id,
        name: s.name,
        type: s.type,
        address: s.address,
        phone: s.phone,
        distanceText: s.distanceText,
        hasHomeDelivery: s.hasHomeDelivery,
        rating: s.rating,
        pricingTier: s.pricingTier,
      })),
      suggestions: ['Show more stores', 'Stores with delivery', 'Set my location'],
    };
  } catch (err) {
    return {
      intent: 'whereToBuy',
      reply: `To find where to buy ${food.keyword}, please enable location access in Settings so I can search nearby stores! 📍`,
      requiresLocation: true,
      stores: [],
      suggestions: ['Enable location', 'Set my city'],
    };
  }
};

/**
 * getResponse — main export (sync for non-location intents)
 */
const getResponse = (message) => {
  const intent = detectIntent(message);
  const options = responses[intent] || responses.default;
  return {
    intent,
    reply: options[Math.floor(Math.random() * options.length)],
    suggestions: getSuggestions(intent),
    isAsync: intent === 'whereToBuy', // signals controller to call async version
  };
};

/**
 * getResponseAsync — call this when intent === 'whereToBuy'
 */
const getResponseAsync = async (message, userId) => {
  const intent = detectIntent(message);
  if (intent === 'whereToBuy') {
    return getWhereToBuyResponse(message, userId);
  }
  return getResponse(message);
};

const getSuggestions = (intent) => {
  const map = {
    greet: ['What is BMI?', 'Generate my meal plan', 'Where can I buy chicken?'],
    bmi: ['How is BMR calculated?', 'Update my health profile'],
    bmr: ['What is TDEE?', 'How are calories calculated?'],
    calories: ['What is BMR?', 'How to lose weight?', 'Generate meal plan'],
    diabetes: ['Diabetic safe foods?', 'Generate diabetic meal plan'],
    hypertension: ['Low sodium foods', 'Generate hypertension meal plan'],
    cardiac: ['Heart healthy foods', 'Generate cardiac meal plan'],
    budget: ['Optimize my budget', 'View grocery list'],
    mealPlan: ['Generate my meal plan', 'View active plan', 'Grocery list'],
    grocery: ['View grocery list', 'Generate meal plan'],
    pakistani: ['Show Pakistani breakfast options', 'Show desi dinner options'],
    location: ['Enable GPS location', 'Set my city', 'Find nearby stores'],
    store: ['Where can I buy chicken?', 'Where to find dal?', 'Stores with delivery'],
    whereToBuy: ['Show more stores', 'Stores with delivery', 'Set my location'],
    default: ['Help', 'What is BMI?', 'Where can I buy groceries?'],
  };
  return map[intent] || map.default;
};

module.exports = { getResponse, getResponseAsync, detectIntent };
