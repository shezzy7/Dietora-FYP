// src/services/mealPlanner.service.js
// DIETORA — Agentic Meal Planning Engine (LangGraph + LangChain)

'use strict';

const FoodItem = require('../models/FoodItem');
const { buildMealPlannerGraph } = require('./ai/mealPlanner/graph');
const NodeCache = require('node-cache');

// Cache foods for 1 hour
const foodCache = new NodeCache({ stdTTL: 3600 });

// ─── Date helpers ─────────────────────────────────────────
const JS_DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const getDayName   = (date) => JS_DAY_NAMES[date.getDay()];
const addDays      = (date, n) => {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
};

// ─── Food resolution ─────────────────────────────────────
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

const resolveFoodByName = (name, foodMap) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();
  const exact = foodMap.get(lower);
  if (exact) return exact;
  for (const [key, food] of foodMap.entries()) {
    if (key.includes(lower) || lower.includes(key)) return food;
  }
  return null;
};

// ─── Assemble Plan from Output ────────────────────────────
const assembleGraphPlan = (agentPlan, foodMap, startDate) => {
  const planStart = new Date(startDate);
  planStart.setHours(0, 0, 0, 0);

  return agentPlan.map((dayData, i) => {
    const dayDate   = addDays(planStart, i);
    const dayName   = getDayName(dayDate);

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

// ─── FALLBACK — Deterministic Rule-Based Engine ────────────
const runFallbackEngine = (foods, profile, startDate) => {
  console.warn('[MealPlanner] AI Agent failed or max retries hit. Using rule-based fallback engine.');
  const allergyLower = (profile.allergies || []).map((a) => a.toLowerCase());
  let pool = foods.filter((f) => !f.allergens?.some((a) => allergyLower.includes(a.toLowerCase())));

  pool = pool.filter((f) => {
    if (profile.isDiabetic       && !f.is_diabetic_safe)     return false;
    if (profile.isHypertensive   && !f.is_hypertension_safe) return false;
    if (profile.isCardiac        && !f.is_cardiac_safe)      return false;
    if (profile.hasKidneyDisease && !f.is_kidney_safe)       return false;
    if (profile.hasThyroid       && !f.is_thyroid_safe)      return false;
    return true;
  });

  if (pool.length < 4) {
    console.warn('[MealPlanner] Fallback: insufficient safe foods, skipping strict filters.');
    pool = foods;
  }

  const byMeal = { breakfast: [], lunch: [], dinner: [], snack: [] };
  pool.forEach((f) => (f.mealType || []).forEach((mt) => { if (byMeal[mt]) byMeal[mt].push(f); }));

  const budgetPerMeal = {
    breakfast: profile.dailyBudget * 0.25,
    lunch:     profile.dailyBudget * 0.35,
    dinner:    profile.dailyBudget * 0.30,
    snack:     profile.dailyBudget * 0.10,
  };

  const affordable = {};
  for (const mt of Object.keys(byMeal)) {
    affordable[mt] = byMeal[mt].filter((f) => f.price <= budgetPerMeal[mt]);
    if (affordable[mt].length === 0) {
      affordable[mt] = [...byMeal[mt]].sort((a, b) => a.price - b.price).slice(0, 3);
    }
    // Greedy Sorting: maximize calories per PKR (value for money to hit goals safely)
    affordable[mt].sort((a, b) => {
      const ratioA = a.calories / (a.price || 1);
      const ratioB = b.calories / (b.price || 1);
      return ratioB - ratioA;
    });
  }

  const used = { breakfast: new Set(), lunch: new Set(), dinner: new Set(), snack: new Set() };
  const pick  = (mt) => {
    const pool = affordable[mt] || [];
    if (!pool.length) return null;
    const unused  = pool.filter((f) => !used[mt].has(f._id.toString()));
    // Pick highest value unused food, fallback to highest value overall
    const chosen  = unused.length > 0 ? unused[0] : pool[0];
    used[mt].add(chosen._id.toString());
    return chosen;
  };

  const planStart = new Date(startDate);
  planStart.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const dayDate = addDays(planStart, i);
    const bf = pick('breakfast'), lu = pick('lunch'), di = pick('dinner'), sn = pick('snack');
    const breakfast = bf ? [buildMealSlot(bf)] : [];
    const lunch     = lu ? [buildMealSlot(lu)] : [];
    const dinner    = di ? [buildMealSlot(di)] : [];
    const snack     = sn ? [buildMealSlot(sn)] : [];
    const all       = [...breakfast, ...lunch, ...dinner, ...snack];

    return {
      day: i + 1, date: dayDate, dayName: getDayName(dayDate),
      breakfast, lunch, dinner, snack,
      totalCalories: Math.round(all.reduce((s, m) => s + (m?.calories || 0), 0)),
      totalProtein:  parseFloat(all.reduce((s, m) => s + (m?.protein  || 0), 0).toFixed(1)),
      totalCarbs:    parseFloat(all.reduce((s, m) => s + (m?.carbs    || 0), 0).toFixed(1)),
      totalFat:      parseFloat(all.reduce((s, m) => s + (m?.fat      || 0), 0).toFixed(1)),
      totalCost:     parseFloat(all.reduce((s, m) => s + (m?.price    || 0), 0).toFixed(2)),
    };
  });
};

// ─── MAIN EXPORT ───────────────────────────────────────────
const generateMealPlan = async (healthProfile, startDate, checkInFeedback = null) => {
  const planStartDate = startDate instanceof Date ? startDate : new Date();
  planStartDate.setHours(0, 0, 0, 0);

  let allFoods = foodCache.get('allFoods');
  if (!allFoods) {
    allFoods = await FoodItem.find({ isAvailable: true }).lean();
    if (allFoods.length > 0) {
      foodCache.set('allFoods', allFoods);
    }
  }

  if (!allFoods || allFoods.length === 0) throw new Error('No food items found in DB.');

  const foodMap = new Map();
  allFoods.forEach((f) => foodMap.set(f.name.toLowerCase().trim(), f));

  let days;
  let aiUsed = true;
  let clinicalAnalysis = null;

  try {
    console.log('[MealPlanner] Initializing LangGraph Agent...');
    const graph = buildMealPlannerGraph();

    // Run the graph
    const finalState = await graph.invoke({
      profile: healthProfile,
      checkInFeedback,
      availableFoods: allFoods,
      startDate: planStartDate,
      generationAttempts: 0
    });

    clinicalAnalysis = finalState.clinicalAnalysis;

    // Check if the graph successfully produced a final plan or exited with errors
    if (!finalState.finalPlan || finalState.validationErrors?.length > 0) {
      console.warn('[MealPlanner] LangGraph finished with unresolved errors. Falling back.', finalState.validationErrors);
      throw new Error("LangGraph generated plan failed strict medical/budget validation.");
    }

    days = assembleGraphPlan(finalState.finalPlan, foodMap, planStartDate);
    
    // Safety check: too many empty days
    const emptyDays = days.filter(d => d.breakfast.length === 0 && d.lunch.length === 0 && d.dinner.length === 0);
    if (emptyDays.length > 3) {
      console.warn('[MealPlanner] Too many empty days in AI plan. Falling back.');
      throw new Error("Too many empty days in plan.");
    }
    
    console.log(`[MealPlanner] LangGraph successful. Attempts: ${finalState.generationAttempts}`);
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
    clinicalAnalysis,
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
