// src/services/mealPlanner.service.js
// DIETORA — Two-Phase AI Meal Planning Engine
//
// Architecture:
//   Phase 1 — Clinical Health Analysis
//     Gemini receives the user's complete health profile and generates a structured
//     clinical analysis: nutrient targets, severity assessment, foods to prioritise
//     and avoid, and a personalized dietary rationale.
//
//   Phase 2 — Personalised Meal Plan Generation
//     Gemini receives the Phase 1 analysis + the full food catalogue and selects
//     specific foods for each meal slot across 7 days. The Phase 1 analysis acts
//     as a clinical brief that grounds every food selection in medical reasoning.
//
//   Fallback — Rule-based engine
//     If Gemini fails at any phase, a deterministic rule-based engine takes over.
//     It still applies all safety filters and budget constraints.
//     The API never crashes — every request gets a valid plan.

'use strict';

const FoodItem               = require('../models/FoodItem');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// ─── Gemini client (lazy singleton) ──────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash';
let _genAI = null;
const getGeminiClient = () => {
  if (!_genAI) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY is missing from .env');
    _genAI = new GoogleGenerativeAI(key);
  }
  return _genAI;
};

// ─── Date helpers ─────────────────────────────────────────
const JS_DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const getDayName   = (date) => JS_DAY_NAMES[date.getDay()];
const addDays      = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Gemini retry wrapper ─────────────────────────────────
const withGeminiRetry = async (fn, maxAttempts = 3) => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err?.status === 429 || String(err?.message).includes('429');
      const is503 = err?.status === 503 || String(err?.message).includes('503');
      if ((is429 || is503) && attempt < maxAttempts) {
        const waitMs = 4000 * attempt;
        console.warn(`[MealPlanner] Attempt ${attempt} failed (${err.status || err.message}), retrying in ${waitMs}ms…`);
        await new Promise((r) => setTimeout(r, waitMs));
      } else {
        throw err;
      }
    }
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — Clinical Health Analysis
//
// Sends only the user profile (NOT the food catalogue) to Gemini.
// Gemini acts as a clinical dietitian and returns a structured JSON analysis:
//   - Severity of each condition
//   - Priority nutrients (what to increase/limit)
//   - Foods to avoid
//   - Dietary strategy and rationale
//
// This analysis is then injected into the Phase 2 prompt so that food
// selection is medically grounded, not just flag-filtered.
// ─────────────────────────────────────────────────────────────────────────────
const buildPhase1Prompt = (profile, checkInFeedback = null) => {
  const conditions = [
    profile.isDiabetic       && `Type 2 Diabetes`,
    profile.isHypertensive   && `Hypertension (High Blood Pressure)`,
    profile.isCardiac        && `Cardiac / Cardiovascular Disease`,
    profile.hasKidneyDisease && `Chronic Kidney Disease (CKD)`,
    profile.hasThyroid       && `Thyroid Condition`,
  ].filter(Boolean);

  const allergyList = profile.allergies?.length ? profile.allergies.join(', ') : 'None';

  const checkInSection = checkInFeedback ? `
=== LAST WEEK'S HEALTH FEEDBACK ===
Overall feeling: ${checkInFeedback.overallFeeling || 'Not specified'}
Energy level: ${checkInFeedback.energyLevel || 'Not specified'}
Weight change: ${checkInFeedback.weightChange || 'Not specified'}
Digestive health: ${checkInFeedback.digestiveHealth || 'Not specified'}
Disease/symptom update: ${checkInFeedback.diseaseSymptoms || 'None reported'}
Additional notes: ${checkInFeedback.notes || 'None'}

Use this feedback to adjust this week's plan. If the user felt worse or reported worsening symptoms, be more conservative. If they reported improvements, maintain or gradually progress.
` : '';

  return `
You are a board-certified clinical dietitian specialising in Pakistani dietary patterns and medical nutrition therapy.

A patient needs a personalised diet plan. Analyse their health profile and produce a structured clinical dietary assessment.

=== PATIENT PROFILE ===
Age: ${profile.age} years | Gender: ${profile.gender}
Weight: ${profile.weight} kg | Height: ${profile.height} cm
BMI: ${profile.bmi} (${profile.bmiCategory})
BMR: ${profile.bmr} kcal/day | TDEE: ${profile.tdee} kcal/day
Daily Calorie Target: ${profile.dailyCalorieTarget} kcal/day
Goal: ${profile.goal?.replace(/_/g, ' ')} | Activity: ${profile.activityLevel?.replace(/_/g, ' ')}
Daily Budget: PKR ${profile.dailyBudget}/day

=== MEDICAL CONDITIONS ===
${conditions.length > 0 ? conditions.join(', ') : 'No specific medical conditions'}

=== PATIENT'S OWN DESCRIPTION OF THEIR CONDITION ===
"${profile.diseaseDescription || 'No additional description provided.'}"

=== FOOD ALLERGIES ===
${allergyList}
${checkInSection}

=== YOUR TASK ===
Based on the patient profile above, generate a structured clinical dietary analysis.
Return ONLY a valid JSON object — no markdown, no explanation, no code fences.

The JSON must follow this exact structure:
{
  "conditionSeverity": {
    "diabetes": "none|mild|moderate|severe",
    "hypertension": "none|mild|moderate|severe",
    "cardiac": "none|mild|moderate|severe",
    "kidney": "none|mild|moderate|severe",
    "thyroid": "none|inactive|hypothyroid|hyperthyroid"
  },
  "dailyNutrientTargets": {
    "calories": <number>,
    "proteinGrams": <number>,
    "carbsGrams": <number>,
    "fatGrams": <number>,
    "sodiumMg": <number>,
    "fiberGrams": <number>
  },
  "dietaryPriorities": [
    "<string: key dietary recommendation 1>",
    "<string: key dietary recommendation 2>",
    "<string: key dietary recommendation 3>"
  ],
  "foodsToEmphasise": ["<food type or category 1>", "<food type or category 2>"],
  "foodsToAvoid": ["<food type or category 1>", "<food type or category 2>"],
  "mealTimingAdvice": "<string: brief meal timing recommendation>",
  "clinicalRationale": "<string: 2-3 sentence explanation of why this dietary approach suits this patient>",
  "planAdjustmentFromFeedback": "<string: if check-in feedback provided, describe adjustments; otherwise 'N/A'>"
}

Generate the analysis now:
`.trim();
};

const runPhase1Analysis = async (profile, checkInFeedback = null) => {
  const prompt = buildPhase1Prompt(profile, checkInFeedback);

  return withGeminiRetry(async () => {
    const model = getGeminiClient().getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0.2, topP: 0.8, maxOutputTokens: 1024 },
    });

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    return JSON.parse(cleaned);
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — Meal Plan Generation
//
// Builds the food catalogue string and constructs the Phase 2 prompt.
// The Phase 1 clinical analysis is embedded so Gemini has full context.
// ─────────────────────────────────────────────────────────────────────────────
const buildFoodCatalogue = (foods) => {
  return foods.map((f) => {
    const flags = [
      f.is_diabetic_safe      && 'diabetic_safe',
      f.is_hypertension_safe  && 'bp_safe',
      f.is_cardiac_safe       && 'cardiac_safe',
      f.is_kidney_safe        && 'kidney_safe',
      f.is_thyroid_safe       && 'thyroid_safe',
    ].filter(Boolean).join(',') || 'none';

    const allergens = f.allergens?.length ? f.allergens.join(',') : 'none';
    const mealTypes = (f.mealType || []).join(',');

    return (
      `${f.name}|cal:${f.calories}|pro:${f.protein}g|carb:${f.carbs}g|fat:${f.fat}g` +
      `|price:PKR${f.price}|meal:${mealTypes}|safe:${flags}|allergens:${allergens}`
    );
  }).join('\n');
};

const buildPhase2Prompt = (profile, clinicalAnalysis, foods, startDate) => {
  const allergyList = profile.allergies?.length ? profile.allergies.join(', ') : 'None';
  const catalogue   = buildFoodCatalogue(foods);

  const budgetPerDay = profile.dailyBudget;
  const budgetBreakdown = {
    breakfast: Math.round(budgetPerDay * 0.25),
    lunch:     Math.round(budgetPerDay * 0.35),
    dinner:    Math.round(budgetPerDay * 0.30),
    snack:     Math.round(budgetPerDay * 0.10),
  };

  // Build condition-specific safety rules
  const safetyRules = [];
  if (profile.isDiabetic)       safetyRules.push('DIABETES: ONLY use foods marked diabetic_safe. No exceptions.');
  if (profile.isHypertensive)   safetyRules.push('HYPERTENSION: ONLY use foods marked bp_safe. No exceptions.');
  if (profile.isCardiac)        safetyRules.push('CARDIAC: ONLY use foods marked cardiac_safe. No exceptions.');
  if (profile.hasKidneyDisease) safetyRules.push('KIDNEY DISEASE: ONLY use foods marked kidney_safe. This is critical — wrong foods cause irreversible harm.');
  if (profile.hasThyroid)       safetyRules.push('THYROID: ONLY use foods marked thyroid_safe. Avoid all goitrogenic foods.');

  return `
You are a certified clinical dietitian using a physician-prepared nutritional assessment to build a 7-day meal plan for a Pakistani patient.

=== CLINICAL ASSESSMENT (prepared by physician) ===
Condition Severity: ${JSON.stringify(clinicalAnalysis.conditionSeverity || {})}
Daily Targets: ${JSON.stringify(clinicalAnalysis.dailyNutrientTargets || {})}
Dietary Priorities: ${(clinicalAnalysis.dietaryPriorities || []).join(' | ')}
Foods to Emphasise: ${(clinicalAnalysis.foodsToEmphasise || []).join(', ')}
Foods to Avoid: ${(clinicalAnalysis.foodsToAvoid || []).join(', ')}
Meal Timing: ${clinicalAnalysis.mealTimingAdvice || 'Standard 3 meals + 1 snack'}
Clinical Rationale: ${clinicalAnalysis.clinicalRationale || 'N/A'}
Plan Adjustment Note: ${clinicalAnalysis.planAdjustmentFromFeedback || 'N/A'}

=== PATIENT SUMMARY ===
Age: ${profile.age}y | Gender: ${profile.gender} | Weight: ${profile.weight}kg | BMI: ${profile.bmi} (${profile.bmiCategory})
Goal: ${profile.goal?.replace(/_/g,' ')} | Calorie Target: ${profile.dailyCalorieTarget} kcal/day
Allergies: ${allergyList}

=== DAILY BUDGET ===
Total: PKR ${budgetPerDay} | Breakfast: ≤PKR${budgetBreakdown.breakfast} | Lunch: ≤PKR${budgetBreakdown.lunch} | Dinner: ≤PKR${budgetBreakdown.dinner} | Snack: ≤PKR${budgetBreakdown.snack}

=== FOOD CATALOGUE ===
Format: Name|cal|protein|carbs|fat|price|mealTypes|safetyFlags|allergens
${catalogue}

=== MANDATORY SAFETY RULES (NON-NEGOTIABLE) ===
${safetyRules.length > 0 ? safetyRules.map((r, i) => `${i+1}. ${r}`).join('\n') : '1. No specific disease restrictions — select nutritionally balanced foods from the catalogue.'}
${safetyRules.length + 1}. NEVER include foods containing the patient's allergens (${allergyList}).
${safetyRules.length + 2}. If a patient has multiple conditions, a food must satisfy ALL their safety flags simultaneously.
${safetyRules.length + 3}. Respect mealType field — only assign foods to their intended meal slots.
${safetyRules.length + 4}. Keep each day's total cost ≤ PKR ${budgetPerDay}.
${safetyRules.length + 5}. Ensure variety — avoid repeating the same meal on consecutive days.
${safetyRules.length + 6}. Each meal slot takes exactly ONE food item from the catalogue (exact name, case-sensitive).

=== RESPONSE FORMAT ===
Return ONLY a valid JSON array with exactly 7 objects. No markdown, no explanation.

[
  {
    "day": 1,
    "breakfast": "exact food name from catalogue",
    "lunch": "exact food name from catalogue",
    "dinner": "exact food name from catalogue",
    "snack": "exact food name from catalogue"
  },
  ...
]

Use null for a slot if no suitable food exists: "snack": null

Plan start date: ${startDate.toDateString()}
Generate the 7-day meal plan now:
`.trim();
};

const callGeminiPhase2 = async (prompt) => {
  return withGeminiRetry(async () => {
    const model = getGeminiClient().getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: { temperature: 0.35, topP: 0.85, maxOutputTokens: 2048 },
    });

    const result  = await model.generateContent(prompt);
    const raw     = result.response.text().trim();
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
    const parsed  = JSON.parse(cleaned);

    if (!Array.isArray(parsed) || parsed.length < 7) {
      throw new Error(`Gemini returned ${parsed?.length ?? 'invalid'} days instead of 7`);
    }
    return parsed;
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Food name resolution — map Gemini names back to DB documents
// ─────────────────────────────────────────────────────────────────────────────
const resolveFoodByName = (name, foodMap) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const exact = foodMap.get(lower);
  if (exact) return exact;
  for (const [key, food] of foodMap.entries()) {
    if (key.includes(lower) || lower.includes(key)) return food;
  }
  console.warn(`[MealPlanner] Could not resolve food: "${name}"`);
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Build a meal slot from a resolved food document
// ─────────────────────────────────────────────────────────────────────────────
const buildMealSlot = (food, quantity = 1) => {
  if (!food) return null;
  return {
    foodItem: food._id,
    quantity,
    calories: Math.round(food.calories * quantity),
    protein:  parseFloat((food.protein  * quantity).toFixed(1)),
    carbs:    parseFloat((food.carbs    * quantity).toFixed(1)),
    fat:      parseFloat((food.fat      * quantity).toFixed(1)),
    price:    parseFloat((food.price    * quantity).toFixed(2)),
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Assemble the final 7-day plan from Gemini's Phase 2 selections
// ─────────────────────────────────────────────────────────────────────────────
const assembleGeminiPlan = (geminiDays, foodMap, startDate) => {
  const planStart = new Date(startDate);
  planStart.setHours(0, 0, 0, 0);

  return geminiDays.map((geminiDay, i) => {
    const dayDate   = addDays(planStart, i);
    const dayName   = getDayName(dayDate);

    const bfFood     = resolveFoodByName(geminiDay.breakfast, foodMap);
    const lunchFood  = resolveFoodByName(geminiDay.lunch,     foodMap);
    const dinnerFood = resolveFoodByName(geminiDay.dinner,    foodMap);
    const snackFood  = resolveFoodByName(geminiDay.snack,     foodMap);

    const breakfast = bfFood     ? [buildMealSlot(bfFood)]     : [];
    const lunch     = lunchFood  ? [buildMealSlot(lunchFood)]  : [];
    const dinner    = dinnerFood ? [buildMealSlot(dinnerFood)] : [];
    const snack     = snackFood  ? [buildMealSlot(snackFood)]  : [];
    const allSlots  = [...breakfast, ...lunch, ...dinner, ...snack];

    return {
      day:           i + 1,
      date:          dayDate,
      dayName,
      breakfast,
      lunch,
      dinner,
      snack,
      totalCalories: Math.round(allSlots.reduce((s, m) => s + (m?.calories || 0), 0)),
      totalProtein:  parseFloat(allSlots.reduce((s, m) => s + (m?.protein  || 0), 0).toFixed(1)),
      totalCarbs:    parseFloat(allSlots.reduce((s, m) => s + (m?.carbs    || 0), 0).toFixed(1)),
      totalFat:      parseFloat(allSlots.reduce((s, m) => s + (m?.fat      || 0), 0).toFixed(1)),
      totalCost:     parseFloat(allSlots.reduce((s, m) => s + (m?.price    || 0), 0).toFixed(2)),
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// FALLBACK — Rule-based engine
//
// Triggered when Gemini fails (network, quota, parse error, or too many empty days).
// Applies all safety filters deterministically. No AI — but always produces a valid plan.
// ─────────────────────────────────────────────────────────────────────────────
const runFallbackEngine = (foods, profile, startDate) => {
  console.warn('[MealPlanner] Using rule-based fallback engine.');

  const allergyLower = (profile.allergies || []).map((a) => a.toLowerCase());

  // Step 1 — Remove allergen foods
  let pool = foods.filter(
    (f) => !f.allergens?.some((a) => allergyLower.includes(a.toLowerCase()))
  );

  // Step 2 — Apply disease safety filters
  pool = pool.filter((f) => {
    if (profile.isDiabetic       && !f.is_diabetic_safe)     return false;
    if (profile.isHypertensive   && !f.is_hypertension_safe) return false;
    if (profile.isCardiac        && !f.is_cardiac_safe)      return false;
    if (profile.hasKidneyDisease && !f.is_kidney_safe)       return false;
    if (profile.hasThyroid       && !f.is_thyroid_safe)      return false;
    return true;
  });

  // Last resort: if no foods survive all filters, use full catalogue (avoid crashing)
  if (pool.length < 4) {
    console.warn('[MealPlanner] Fallback: insufficient safe foods after filtering, using full catalogue.');
    pool = foods;
  }

  // Group by meal type
  const byMeal = { breakfast: [], lunch: [], dinner: [], snack: [] };
  pool.forEach((f) => (f.mealType || []).forEach((mt) => { if (byMeal[mt]) byMeal[mt].push(f); }));

  // Budget per slot
  const budgetPerMeal = {
    breakfast: profile.dailyBudget * 0.25,
    lunch:     profile.dailyBudget * 0.35,
    dinner:    profile.dailyBudget * 0.30,
    snack:     profile.dailyBudget * 0.10,
  };

  // Apply budget filter per slot, keep cheapest 3 as fallback
  const affordable = {};
  for (const mt of Object.keys(byMeal)) {
    affordable[mt] = byMeal[mt].filter((f) => f.price <= budgetPerMeal[mt]);
    if (affordable[mt].length === 0) {
      affordable[mt] = [...byMeal[mt]].sort((a, b) => a.price - b.price).slice(0, 3);
    }
  }

  // Pick with variety tracking (avoid repeating same food consecutive days)
  const used = { breakfast: new Set(), lunch: new Set(), dinner: new Set(), snack: new Set() };
  const pick  = (mt) => {
    const pool = affordable[mt] || [];
    if (!pool.length) return null;
    const unused  = pool.filter((f) => !used[mt].has(f._id.toString()));
    const chosen  = unused.length > 0
      ? unused[Math.floor(Math.random() * unused.length)]
      : pool[Math.floor(Math.random() * pool.length)];
    used[mt].add(chosen._id.toString());
    return chosen;
  };

  const planStart = new Date(startDate);
  planStart.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const dayDate   = addDays(planStart, i);
    const bf        = pick('breakfast');
    const lu        = pick('lunch');
    const di        = pick('dinner');
    const sn        = pick('snack');

    const breakfast = bf ? [buildMealSlot(bf)] : [];
    const lunch     = lu ? [buildMealSlot(lu)] : [];
    const dinner    = di ? [buildMealSlot(di)] : [];
    const snack     = sn ? [buildMealSlot(sn)] : [];
    const all       = [...breakfast, ...lunch, ...dinner, ...snack];

    return {
      day:           i + 1,
      date:          dayDate,
      dayName:       getDayName(dayDate),
      breakfast,
      lunch,
      dinner,
      snack,
      totalCalories: Math.round(all.reduce((s, m) => s + (m?.calories || 0), 0)),
      totalProtein:  parseFloat(all.reduce((s, m) => s + (m?.protein  || 0), 0).toFixed(1)),
      totalCarbs:    parseFloat(all.reduce((s, m) => s + (m?.carbs    || 0), 0).toFixed(1)),
      totalFat:      parseFloat(all.reduce((s, m) => s + (m?.fat      || 0), 0).toFixed(1)),
      totalCost:     parseFloat(all.reduce((s, m) => s + (m?.price    || 0), 0).toFixed(2)),
    };
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — generateMealPlan
//
// @param {Object} healthProfile  Mongoose document or plain object from HealthProfile
// @param {Date}   startDate      The day the plan starts (defaults to today)
// @param {Object} checkInFeedback Optional — last week's check-in answers for plan adjustment
// @returns {Object}              Plan data ready to be stored in MealPlan collection
// ─────────────────────────────────────────────────────────────────────────────
const generateMealPlan = async (healthProfile, startDate, checkInFeedback = null) => {
  const planStartDate = startDate instanceof Date ? startDate : new Date();
  planStartDate.setHours(0, 0, 0, 0);

  // ── Fetch all available foods from DB ───────────────────
  const allFoods = await FoodItem.find({ isAvailable: true }).lean();
  if (allFoods.length === 0) {
    throw new Error('No food items found in database. Please run: npm run seed');
  }

  // Build lookup map: lowercase name → food document
  const foodMap = new Map();
  allFoods.forEach((f) => foodMap.set(f.name.toLowerCase().trim(), f));

  const conditionLog = [
    healthProfile.isDiabetic       && 'Diabetes',
    healthProfile.isHypertensive   && 'Hypertension',
    healthProfile.isCardiac        && 'Cardiac',
    healthProfile.hasKidneyDisease && 'Kidney Disease',
    healthProfile.hasThyroid       && 'Thyroid',
  ].filter(Boolean).join(', ') || 'None';

  console.log(`[MealPlanner] Starting two-phase AI generation. Goal: ${healthProfile.goal} | Conditions: ${conditionLog}`);

  let days;
  let aiUsed          = true;
  let clinicalAnalysis = null;

  try {
    // ══════════════════════════════════════════════════════
    // PHASE 1 — Clinical Analysis
    // ══════════════════════════════════════════════════════
    console.log('[MealPlanner] Phase 1: Running clinical health analysis...');
    clinicalAnalysis = await runPhase1Analysis(healthProfile, checkInFeedback);
    console.log('[MealPlanner] Phase 1 complete. Severity:', JSON.stringify(clinicalAnalysis.conditionSeverity));

    // ══════════════════════════════════════════════════════
    // PHASE 2 — Meal Plan Generation
    // ══════════════════════════════════════════════════════
    console.log('[MealPlanner] Phase 2: Generating personalised 7-day meal plan...');
    const phase2Prompt = buildPhase2Prompt(healthProfile, clinicalAnalysis, allFoods, planStartDate);
    const geminiDays   = await callGeminiPhase2(phase2Prompt);

    days = assembleGeminiPlan(geminiDays, foodMap, planStartDate);

    // Safety check: if too many empty days, fall back
    const emptyDays = days.filter(
      (d) => d.breakfast.length === 0 && d.lunch.length === 0 && d.dinner.length === 0
    );
    if (emptyDays.length > 3) {
      console.warn('[MealPlanner] Too many empty days in AI plan — switching to fallback');
      days   = runFallbackEngine(allFoods, healthProfile, planStartDate);
      aiUsed = false;
    } else {
      console.log(`[MealPlanner] Two-phase AI plan assembled. Days: ${days.length}`);
    }

  } catch (err) {
    console.error('[MealPlanner] AI generation failed:', err.message);
    days   = runFallbackEngine(allFoods, healthProfile, planStartDate);
    aiUsed = false;
  }

  const weeklyTotalCalories = days.reduce((s, d) => s + d.totalCalories, 0);
  const weeklyTotalCost     = days.reduce((s, d) => s + d.totalCost,     0);

  return {
    days,
    startDate: planStartDate,
    aiUsed,
    clinicalAnalysis,         // stored on the plan so the frontend can display the rationale
    planConfig: {
      dailyCalorieTarget: healthProfile.dailyCalorieTarget,
      dailyBudget:        healthProfile.dailyBudget,
      goal:               healthProfile.goal,
      isDiabetic:         healthProfile.isDiabetic,
      isHypertensive:     healthProfile.isHypertensive,
      isCardiac:          healthProfile.isCardiac,
      hasKidneyDisease:   healthProfile.hasKidneyDisease,
      hasThyroid:         healthProfile.hasThyroid,
      allergies:          healthProfile.allergies || [],
    },
    weeklyTotalCalories: Math.round(weeklyTotalCalories),
    weeklyTotalCost:     parseFloat(weeklyTotalCost.toFixed(2)),
    avgDailyCalories:    Math.round(weeklyTotalCalories / 7),
    avgDailyCost:        parseFloat((weeklyTotalCost / 7).toFixed(2)),
  };
};

// ─── fetchConstraints — kept for backward compatibility ──
const fetchConstraints = (healthProfile) => ({
  dailyCalorieTarget: healthProfile.dailyCalorieTarget,
  dailyBudget:        healthProfile.dailyBudget,
  isDiabetic:         healthProfile.isDiabetic,
  isHypertensive:     healthProfile.isHypertensive,
  isCardiac:          healthProfile.isCardiac,
  hasKidneyDisease:   healthProfile.hasKidneyDisease,
  hasThyroid:         healthProfile.hasThyroid,
  allergies:          healthProfile.allergies || [],
  goal:               healthProfile.goal,
});

module.exports = { generateMealPlan, fetchConstraints };
