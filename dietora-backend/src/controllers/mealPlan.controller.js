// src/controllers/mealPlan.controller.js
// DIETORA — Meal Plan Controller
// v4: saves price metadata (source, summary, timestamp) from price engine

'use strict';

const MealPlan      = require('../models/MealPlan');
const HealthProfile = require('../models/HealthProfile');
const WeeklyProgress = require('../models/WeeklyProgress');
const { generateMealPlan }     = require('../services/mealPlanner.service');
const { updateMealPlanPrices } = require('../services/priceUpdater.service');
const { successResponse, paginatedResponse } = require('../utils/response.utils');

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
    let populated = await MealPlan.findById(mealPlan._id).populate(
      'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem'
    );

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
      populated = await MealPlan.findById(mealPlan._id).populate(
        'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem'
      );

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
      .populate('days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem');

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
      .populate('days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem');
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
      .populate('days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem');
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

module.exports = { generate, getAll, getActive, getById, getDayPlan, archivePlan };
