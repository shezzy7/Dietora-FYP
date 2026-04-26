// src/services/mealPlanner.service.js
// DIETORA — Agentic Meal Planning Engine (LangGraph + Groq)

'use strict';

const FoodItem = require('../models/FoodItem');
const { buildMealPlannerGraph } = require('./ai/mealPlanner/graph');
const NodeCache = require('node-cache');

// ─── Food cache (1 hour TTL) ──────────────────────────────
const foodCache = new NodeCache({ stdTTL: 3600 });

// ─── Date helpers ──────────────────────────────────────────
const JS_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const getDayName = (date) => JS_DAY_NAMES[date.getDay()];
const addDays = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Retry helper (for transient API errors) ────────────
const withRetry = async (fn, maxAttempts = 3, baseDelayMs = 2000) => {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      const isTransient =
        err.status === 429 ||
        err.status === 503 ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('overloaded') ||
        err.message?.includes('network') ||
        err.message?.includes('UNAVAILABLE');

      if (!isTransient || attempt === maxAttempts) {
        console.error(`[MealPlanner] Non-retryable error or max attempts reached:`, err.message);
        break;
      }

      const delay = baseDelayMs * attempt;
      console.warn(`[MealPlanner] Transient error on attempt ${attempt}. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastError;
};

// ─── Build a meal slot object from a FoodItem ─────────────
const buildMealSlot = (food, quantity = 1) => {
  if (!food) return null;
  return {
    foodItem: food._id,
    quantity,
    calories: Math.round(food.calories * quantity),
    protein: parseFloat((food.protein * quantity).toFixed(1)),
    carbs: parseFloat((food.carbs * quantity).toFixed(1)),
    fat: parseFloat((food.fat * quantity).toFixed(1)),
    price: parseFloat((food.price * quantity).toFixed(2)),
  };
};

/**
 * Resolve a food name to a FoodItem using a 3-tier fuzzy match:
 *   1. Exact match (case-insensitive)
 *   2. One name contains the other
 *   3. Significant token overlap (>= 50% of tokens match)
 */
const resolveFoodByName = (name, foodMap) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  if (foodMap.has(lower)) return foodMap.get(lower);

  for (const [key, food] of foodMap.entries()) {
    if (key.includes(lower) || lower.includes(key)) return food;
  }

  const queryTokens = new Set(lower.split(/\s+/));
  let bestMatch = null;
  let bestScore = 0;

  for (const [key, food] of foodMap.entries()) {
    const keyTokens = key.split(/\s+/);
    const matches = keyTokens.filter((t) => queryTokens.has(t)).length;
    const score = matches / Math.max(keyTokens.length, queryTokens.size);
    if (score > bestScore && score >= 0.5) {
      bestScore = score;
      bestMatch = food;
    }
  }

  if (bestMatch) {
    console.warn(`[MealPlanner] Fuzzy matched "${name}" → "${bestMatch.name}" (score: ${bestScore.toFixed(2)})`);
  } else {
    console.warn(`[MealPlanner] Could not resolve food name: "${name}"`);
  }

  return bestMatch;
};

// ─── Assemble DB-ready plan from LangGraph output ──────────
const assembleGraphPlan = (agentPlan, foodMap, startDate) => {
  const planStart = new Date(startDate);
  planStart.setHours(0, 0, 0, 0);

  return agentPlan.map((dayData, i) => {
    const dayDate = addDays(planStart, i);
    const dayName = getDayName(dayDate);

    const bfFood     = resolveFoodByName(dayData.breakfast, foodMap);
    const lunchFood  = resolveFoodByName(dayData.lunch,     foodMap);
    const dinnerFood = resolveFoodByName(dayData.dinner,    foodMap);
    const snackFood  = resolveFoodByName(dayData.snack,     foodMap);

    const breakfast = bfFood     ? [buildMealSlot(bfFood)]     : [];
    const lunch     = lunchFood  ? [buildMealSlot(lunchFood)]  : [];
    const dinner    = dinnerFood ? [buildMealSlot(dinnerFood)] : [];
    const snack     = snackFood  ? [buildMealSlot(snackFood)]  : [];
    const allSlots  = [...breakfast, ...lunch, ...dinner, ...snack];

    return {
      day: i + 1,
      date: dayDate,
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

// ─── MAIN EXPORT ───────────────────────────────────────────
/**
 * Generate a personalised 7-day meal plan using the LangGraph agent.
 *
 * Returns planDataSource = 'greedy_fallback' when the LLM failed all retries
 * and the deterministic engine was used instead. The controller must persist
 * this field so the frontend can show the appropriate disclosure banner.
 *
 * @param {Object} healthProfile     - HealthProfile mongoose document (or lean object)
 * @param {Date}   startDate         - Plan start date
 * @param {Object} [checkInFeedback] - Optional weekly check-in feedback
 * @returns {Object} planData        - Days + summary stats + planDataSource
 */
const generateMealPlan = async (healthProfile, startDate, checkInFeedback = null) => {
  const planStartDate = startDate instanceof Date ? startDate : new Date();
  planStartDate.setHours(0, 0, 0, 0);

  // Load foods (cached for 1 hour)
  let allFoods = foodCache.get('allFoods');
  if (!allFoods) {
    allFoods = await FoodItem.find({ isAvailable: true }).lean();
    if (allFoods.length > 0) foodCache.set('allFoods', allFoods);
  }

  if (!allFoods || allFoods.length === 0) {
    throw new Error('No available food items found in the database.');
  }

  const foodMap = new Map();
  allFoods.forEach((f) => foodMap.set(f.name.toLowerCase().trim(), f));

  console.log(`[MealPlanner] Starting LangGraph agent. Foods available: ${allFoods.length}`);

  const finalState = await withRetry(async () => {
    const graph = buildMealPlannerGraph();
    return await graph.invoke({
      profile: healthProfile,
      checkInFeedback,
      availableFoods: allFoods,
      startDate: planStartDate,
      generationAttempts: 0,
    });
  });

  if (!finalState.finalPlan || finalState.finalPlan.length < 7) {
    const errSummary = (finalState.validationErrors || []).join('; ') || 'Unknown error';
    throw new Error(
      `Meal plan generation failed after ${finalState.generationAttempts} attempt(s). ` +
      `Validation errors: ${errSummary}`
    );
  }

  const days = assembleGraphPlan(finalState.finalPlan, foodMap, planStartDate);

  const emptyDays = days.filter(
    (d) => d.breakfast.length === 0 && d.lunch.length === 0 && d.dinner.length === 0
  );
  if (emptyDays.length > 2) {
    throw new Error(
      `Plan assembly produced ${emptyDays.length} empty days — food names could not be resolved.`
    );
  }

  // ── Determine plan data source ────────────────────────────
  // usedFallback is set by greedyFallbackNode in nodes.js
  const planDataSource = finalState.usedFallback ? 'greedy_fallback' : 'ai_generated';

  if (finalState.usedFallback) {
    console.warn(
      `[MealPlanner] ⚠ Plan produced by GREEDY FALLBACK after ${finalState.generationAttempts} failed LLM attempt(s). ` +
      `Plan is medically safe but less personalised. planDataSource='greedy_fallback'`
    );
  } else {
    console.log(
      `[MealPlanner] ✔ AI plan generated in ${finalState.generationAttempts} attempt(s). planDataSource='ai_generated'`
    );
  }

  const weeklyTotalCalories = days.reduce((s, d) => s + d.totalCalories, 0);
  const weeklyTotalCost     = days.reduce((s, d) => s + d.totalCost,     0);

  return {
    days,
    startDate:    planStartDate,
    aiUsed:       true,
    planDataSource,                        // ← NEW: 'ai_generated' | 'greedy_fallback'
    clinicalAnalysis: finalState.clinicalAnalysis,
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

module.exports = { generateMealPlan };
