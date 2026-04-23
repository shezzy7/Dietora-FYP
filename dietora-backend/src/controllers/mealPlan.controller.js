// src/controllers/mealPlan.controller.js
// DIETORA — Meal Plan Controller

'use strict';

const MealPlan        = require('../models/MealPlan');
const HealthProfile   = require('../models/HealthProfile');
const WeeklyProgress  = require('../models/WeeklyProgress');
const FoodItem        = require('../models/FoodItem');  // BUG FIX: was required inside fn bodies
const { generateMealPlan }     = require('../services/mealPlanner.service');
const { updateMealPlanPrices } = require('../services/priceUpdater.service');
const { generateTailoredRecipe } = require('../services/ai/recipeGenerator');
const { successResponse, paginatedResponse } = require('../utils/response.utils');

// BUG FIX: extract the repeated populate path string into one constant
const POPULATE_MEALS = 'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem';

const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// ─── Helper: auto-init weekly progress tracker ────────────
const initProgressForPlan = async (userId, mealPlanId) => {
  try {
    const existing = await WeeklyProgress.findOne({ user: userId, mealPlan: mealPlanId });
    if (existing) return existing;
    const count = await WeeklyProgress.countDocuments({ user: userId });
    return await WeeklyProgress.create({
      user:       userId,
      mealPlan:   mealPlanId,
      weekNumber: count + 1,
      days: Array.from({ length: 7 }, (_, i) => ({
        day:     i + 1,
        dayName: DAY_NAMES[i],
        meals:   MEAL_TYPES.map((mt) => ({ mealType: mt, completed: false, completedAt: null })),
        allCompleted:     false,
        caloriesConsumed: 0,
        costSpent:        0,
      })),
    });
  } catch (err) {
    console.warn('[MealPlan] Could not auto-init progress:', err.message);
    return null;
  }
};

/**
 * POST /api/v1/meal-plans/generate
 * AI-generate a personalised 7-day meal plan + attach real-time PKR prices.
 */
const generate = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(400).json({
        success: false,
        message: 'Please create your health profile first before generating a meal plan.',
      });
    }

    // Archive any existing active plan
    await MealPlan.updateMany({ user: req.user._id, status: 'active' }, { status: 'archived' });

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // ── Phase 1 + 2: AI clinical analysis + meal selection ──
    const planData = await generateMealPlan(profile, startDate);

    const startLabel = startDate.toLocaleDateString('en-PK', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    });

    const mealPlan = await MealPlan.create({
      user:          req.user._id,
      healthProfile: profile._id,
      title:         `7-Day Plan starting ${startLabel}`,
      startDate,
      ...planData,
    });

    // ── Populate food item details ───────────────────────────
    let populated = await MealPlan.findById(mealPlan._id).populate(POPULATE_MEALS);

    // ── Fetch real-time prices (grounded → AI → static) ─────
    let priceDataSource    = 'static';
    let priceSourceSummary = { grounded: 0, ai: 0, static: 0 };

    try {
      console.log('[MealPlan] Starting real-time price update...');
      const updatedPlan = await updateMealPlanPrices(populated);

      priceDataSource    = updatedPlan.priceDataSource    || 'static';
      priceSourceSummary = updatedPlan.priceSourceSummary || { grounded: 0, ai: 0, static: 0 };

      // Persist updated prices + metadata back to DB
      await MealPlan.findByIdAndUpdate(mealPlan._id, {
        days:               updatedPlan.days,
        weeklyTotalCost:    updatedPlan.weeklyTotalCost,
        avgDailyCost:       updatedPlan.avgDailyCost,
        priceDataSource,
        priceSourceSummary,
        priceLastUpdated:   new Date(),
      });

      // Re-populate with updated slots
      populated = await MealPlan.findById(mealPlan._id).populate(POPULATE_MEALS);

      console.log(`[MealPlan] Prices updated. Source: ${priceDataSource}`, priceSourceSummary);
    } catch (priceErr) {
      console.warn('[MealPlan] Price update failed (serving DB prices as fallback):', priceErr.message);
    }

    // ── Auto-init weekly progress tracker ────────────────────
    const progress = await initProgressForPlan(req.user._id, mealPlan._id);

    const sourceLabels = {
      grounded: '🌐 Live Google Search',
      ai:       '🤖 AI Knowledge',
      static:   '📊 Market Research',
    };

    return successResponse(
      res,
      { mealPlan: populated, progressId: progress?._id },
      `7-day meal plan generated! Prices from ${sourceLabels[priceDataSource]} 🎉`,
      201
    );
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/meal-plans
 * All plans for current user (paginated, no day detail).
 */
const getAll = async (req, res, next) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip  = (page - 1) * limit;
    const filter = { user: req.user._id };
    if (req.query.status) filter.status = req.query.status;

    const [plans, total] = await Promise.all([
      MealPlan.find(filter).select('-days').sort({ createdAt: -1 }).skip(skip).limit(limit),
      MealPlan.countDocuments(filter),
    ]);

    return paginatedResponse(res, plans, total, page, limit, 'Meal plans fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/meal-plans/active
 * Current active plan + progress tracker.
 */
const getActive = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ user: req.user._id, status: 'active' })
      .populate(POPULATE_MEALS);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'No active meal plan found. Generate one at POST /meal-plans/generate',
      });
    }

    const progress = await WeeklyProgress.findOne({ user: req.user._id, mealPlan: plan._id });
    return successResponse(res, { mealPlan: plan, progress: progress || null }, 'Active meal plan fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/meal-plans/:id
 */
const getById = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id })
      .populate(POPULATE_MEALS);
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });
    return successResponse(res, plan, 'Meal plan fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/meal-plans/:id/day/:dayNumber
 */
const getDayPlan = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id })
      .populate(POPULATE_MEALS);
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });

    const day = plan.days.find((d) => d.day === parseInt(req.params.dayNumber));
    if (!day) return res.status(404).json({ success: false, message: `Day ${req.params.dayNumber} not found.` });

    return successResponse(res, day, `Day ${req.params.dayNumber} plan fetched`);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/meal-plans/:id
 * Soft-delete (archive) a plan.
 */
const archivePlan = async (req, res, next) => {
  try {
    const plan = await MealPlan.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { status: 'archived' },
      { new: true }
    );
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });
    return successResponse(res, {}, 'Meal plan archived successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/meal-plans/:id/alternatives
 * Get 3 safe alternatives for a specific meal slot.
 */
const getAlternatives = async (req, res, next) => {
  try {
    const { day, meal } = req.query; // day=1, meal=breakfast
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });

    // Find foods matching mealType — BUG FIX: FoodItem now imported at top
    const filter = { isAvailable: true, mealType: meal };
    if (!meal) {
      return res.status(400).json({ success: false, message: 'Query param "meal" (mealType) is required.' });
    }
    
    // Apply medical rules
    if (plan.planConfig.isDiabetic) filter.is_diabetic_safe = true;
    if (plan.planConfig.isHypertensive) filter.is_hypertension_safe = true;
    if (plan.planConfig.isCardiac) filter.is_cardiac_safe = true;
    if (plan.planConfig.hasKidneyDisease) filter.is_kidney_safe = true;
    if (plan.planConfig.hasThyroid) filter.is_thyroid_safe = true;
    
    const FoodItem = require('../models/FoodItem');
    let foods = await FoodItem.find(filter).lean();
    
    // Filter allergies
    const allergyLower = (plan.planConfig.allergies || []).map(a => a.toLowerCase());
    foods = foods.filter(f => !f.allergens?.some(a => allergyLower.includes(a.toLowerCase())));

    // Filter by budget for this meal slot
    const budgetMap = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
    const maxBudget = plan.planConfig.dailyBudget * (budgetMap[meal] || 0.25);
    
    let affordable = foods.filter(f => f.price <= maxBudget);
    if (affordable.length === 0) affordable = foods; // fallback
    
    // Sort by calorie value (greedy)
    affordable.sort((a, b) => (b.calories / (b.price || 1)) - (a.calories / (a.price || 1)));
    
    // Return top 3 alternatives
    const alternatives = affordable.slice(0, 3);
    
    return successResponse(res, alternatives, 'Alternatives fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/meal-plans/:id/swap
 * Swap a meal slot with a new food item.
 */
const swapMeal = async (req, res, next) => {
  try {
    const { day, meal, foodItemId } = req.body;
    const plan = await MealPlan.findOne({ _id: req.params.id, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });

    // BUG FIX: FoodItem now imported at top — no dynamic require()
    const food = await FoodItem.findById(foodItemId).lean();
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found.' });

    const dayIndex = plan.days.findIndex(d => d.day === parseInt(day));
    if (dayIndex === -1) return res.status(404).json({ success: false, message: 'Day not found.' });

    // Replace the meal slot
    plan.days[dayIndex][meal] = [{
      foodItem: food._id,
      quantity: 1,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      price: food.price,
      priceSource: 'static'
    }];

    // Recalculate day totals
    const dayData = plan.days[dayIndex];
    const allSlots = [...dayData.breakfast, ...dayData.lunch, ...dayData.dinner, ...dayData.snack];
    dayData.totalCalories = Math.round(allSlots.reduce((s, m) => s + m.calories, 0));
    dayData.totalProtein = parseFloat(allSlots.reduce((s, m) => s + m.protein, 0).toFixed(1));
    dayData.totalCarbs = parseFloat(allSlots.reduce((s, m) => s + m.carbs, 0).toFixed(1));
    dayData.totalFat = parseFloat(allSlots.reduce((s, m) => s + m.fat, 0).toFixed(1));
    dayData.totalCost = parseFloat(allSlots.reduce((s, m) => s + m.price, 0).toFixed(2));

    // Recalculate weekly totals
    plan.weeklyTotalCalories = Math.round(plan.days.reduce((s, d) => s + d.totalCalories, 0));
    plan.weeklyTotalCost = parseFloat(plan.days.reduce((s, d) => s + d.totalCost, 0).toFixed(2));
    plan.avgDailyCalories = Math.round(plan.weeklyTotalCalories / 7);
    plan.avgDailyCost = parseFloat((plan.weeklyTotalCost / 7).toFixed(2));

    await plan.save();
    
    // Populate before returning
    const populated = await MealPlan.findById(plan._id).populate(POPULATE_MEALS);

    return successResponse(res, populated, 'Meal swapped successfully');
  } catch (error) {
    next(error);
  }
};

const getRecipe = async (req, res, next) => {
  try {
    // BUG FIX: FoodItem and HealthProfile now imported at top
    const food = await FoodItem.findById(req.params.foodId).lean();
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found.' });

    const profile = await HealthProfile.findOne({ user: req.user._id }).lean();
    if (!profile) return res.status(400).json({ success: false, message: 'Health profile not found.' });

    // BUG FIX: generateTailoredRecipe now imported at top
    const recipe = await generateTailoredRecipe(food.name, profile);
    
    return successResponse(res, recipe, 'Recipe generated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { generate, getAll, getActive, getById, getDayPlan, archivePlan, getAlternatives, swapMeal, getRecipe };
