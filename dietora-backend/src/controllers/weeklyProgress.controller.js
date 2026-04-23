// src/controllers/weeklyProgress.controller.js
// Handles meal check-offs and end-of-week health check-ins

const WeeklyProgress = require('../models/WeeklyProgress');
const MealPlan       = require('../models/MealPlan');
const HealthProfile  = require('../models/HealthProfile');
const { generateMealPlan }    = require('../services/mealPlanner.service');
const { updateMealPlanPrices } = require('../services/priceUpdater.service');
const { successResponse }     = require('../utils/response.utils');

const DAY_NAMES  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];

// ─── Helper: initialize 7 empty days ─────────────────────
const buildEmptyDays = () =>
  Array.from({ length: 7 }, (_, i) => ({
    day:     i + 1,
    dayName: DAY_NAMES[i],
    meals:   MEAL_TYPES.map((mealType) => ({ mealType, completed: false, completedAt: null })),
    allCompleted:     false,
    caloriesConsumed: 0,
    costSpent:        0,
    completedAt:      null,
  }));

/**
 * @route   POST /api/v1/progress/init
 */
const initProgress = async (req, res, next) => {
  try {
    const { mealPlanId } = req.body;
    const plan = await MealPlan.findOne({ _id: mealPlanId, user: req.user._id });
    if (!plan) return res.status(404).json({ success: false, message: 'Meal plan not found.' });

    const existing = await WeeklyProgress.findOne({ user: req.user._id, mealPlan: mealPlanId });
    if (existing) return successResponse(res, existing, 'Progress tracker already exists');

    const prevCount = await WeeklyProgress.countDocuments({ user: req.user._id });
    const progress  = await WeeklyProgress.create({
      user: req.user._id,
      mealPlan: mealPlanId,
      weekNumber: prevCount + 1,
      days: buildEmptyDays(),
    });

    return successResponse(res, progress, 'Weekly progress tracker initialized!', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/progress/current
 */
const getCurrent = async (req, res, next) => {
  try {
    const progress = await WeeklyProgress.findOne({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('mealPlan', 'title days planConfig clinicalAnalysis');
    if (!progress) return res.status(404).json({ success: false, message: 'No progress tracker found.' });
    return successResponse(res, progress, 'Progress fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/progress
 */
const getAll = async (req, res, next) => {
  try {
    const records = await WeeklyProgress.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .select('-days.meals')
      .limit(20);
    return successResponse(res, records, 'Progress history fetched');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/progress/:progressId/day/:day/meal
 */
const toggleMeal = async (req, res, next) => {
  try {
    const { progressId, day } = req.params;
    const { mealType, completed } = req.body;
    const dayNum = parseInt(day);

    if (!MEAL_TYPES.includes(mealType)) {
      return res.status(400).json({ success: false, message: 'Invalid meal type.' });
    }

    const progress = await WeeklyProgress.findOne({ _id: progressId, user: req.user._id });
    if (!progress) return res.status(404).json({ success: false, message: 'Progress record not found.' });

    const dayRecord = progress.days.find((d) => d.day === dayNum);
    if (!dayRecord) return res.status(404).json({ success: false, message: `Day ${dayNum} not found.` });

    const meal = dayRecord.meals.find((m) => m.mealType === mealType);
    if (!meal) return res.status(404).json({ success: false, message: `Meal "${mealType}" not found.` });

    meal.completed  = completed;
    meal.completedAt = completed ? new Date() : null;
    dayRecord.allCompleted = dayRecord.meals.every((m) => m.completed);
    if (dayRecord.allCompleted) dayRecord.completedAt = new Date();

    const allDaysDone = progress.days.every((d) => d.meals.every((m) => m.completed));
    if (allDaysDone) progress.weekCompleted = true;

    // Recalculate day's calories/cost from the referenced meal plan
    const mealPlan = await MealPlan.findById(progress.mealPlan).populate(
      'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem'
    );
    if (mealPlan) {
      const planDay = mealPlan.days.find((d) => d.day === dayNum);
      if (planDay) {
        dayRecord.caloriesConsumed = dayRecord.meals
          .filter((m) => m.completed)
          .reduce((sum, m) => sum + (planDay[m.mealType]?.[0]?.calories || 0), 0);
        dayRecord.costSpent = dayRecord.meals
          .filter((m) => m.completed)
          .reduce((sum, m) => sum + (planDay[m.mealType]?.[0]?.price || 0), 0);
      }
    }

    await progress.save();
    return successResponse(res, progress, `${mealType} marked as ${completed ? 'complete' : 'incomplete'}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/progress/:progressId/checkin
 */
const submitCheckIn = async (req, res, next) => {
  try {
    const { progressId } = req.params;
    const { energyLevel, weightChange, currentWeight, digestiveHealth, overallFeeling, diseaseSymptoms, notes } = req.body;

    const progress = await WeeklyProgress.findOne({ _id: progressId, user: req.user._id });
    if (!progress) return res.status(404).json({ success: false, message: 'Progress record not found.' });

    progress.checkIn = {
      energyLevel:     energyLevel     || '',
      weightChange:    weightChange     || '',
      currentWeight:   currentWeight   || null,
      digestiveHealth: digestiveHealth || '',
      overallFeeling:  overallFeeling  || '',
      diseaseSymptoms: diseaseSymptoms || '',
      notes:           notes           || '',
      submittedAt:     new Date(),
    };
    progress.checkInCompleted = true;
    progress.weekCompleted    = true;

    await progress.save();

    // Auto-update health profile weight if provided
    if (currentWeight && currentWeight > 10 && currentWeight < 300) {
      const profile = await HealthProfile.findOne({ user: req.user._id });
      if (profile) {
        profile.weight = parseFloat(currentWeight);
        await profile.save(); // triggers BMI/BMR/TDEE recalculation
        console.log(`[Progress] Weight updated to ${currentWeight}kg — TDEE recalculated.`);
      }
    }

    return successResponse(res, progress, 'Health check-in submitted! Generating your next week plan...');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/progress/:progressId/regenerate
 * Generates next week's plan using check-in feedback as context for the AI.
 */
const regenerateAfterCheckIn = async (req, res, next) => {
  try {
    const { progressId } = req.params;

    const progress = await WeeklyProgress.findOne({ _id: progressId, user: req.user._id });
    if (!progress) return res.status(404).json({ success: false, message: 'Progress record not found.' });
    if (!progress.checkInCompleted) {
      return res.status(400).json({ success: false, message: 'Please submit your health check-in first.' });
    }

    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) return res.status(400).json({ success: false, message: 'Health profile not found.' });

    // Archive old active plan
    await MealPlan.updateMany({ user: req.user._id, status: 'active' }, { status: 'archived' });

    // ── Apply check-in feedback to calorie adjustment ──────
    const adjustedProfile = profile.toObject();
    const feeling = progress.checkIn?.overallFeeling;

    if ((feeling === 'much_worse' || feeling === 'worse') && adjustedProfile.goal === 'weight_loss') {
      // Soften calorie deficit — reduce it by 100 kcal to avoid burnout
      adjustedProfile.dailyCalorieTarget = Math.round(
        (adjustedProfile.dailyCalorieTarget || adjustedProfile.tdee) + 100
      );
      console.log(`[Progress] Check-in: feeling ${feeling} — softening deficit by 100 kcal`);
    }

    // ── Pass check-in feedback to Phase 1 analysis ─────────
    // The AI will factor in last week's symptom report and notes
    const checkInFeedback = progress.checkIn
      ? {
          overallFeeling:  progress.checkIn.overallFeeling,
          energyLevel:     progress.checkIn.energyLevel,
          weightChange:    progress.checkIn.weightChange,
          digestiveHealth: progress.checkIn.digestiveHealth,
          diseaseSymptoms: progress.checkIn.diseaseSymptoms,
          notes:           progress.checkIn.notes,
        }
      : null;

    console.log(`[Progress] Regenerating Week ${progress.weekNumber + 1} with check-in context...`);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    // Two-phase AI generation with check-in feedback injected into Phase 1
    const planData = await generateMealPlan(adjustedProfile, startDate, checkInFeedback);

    const newPlan = await MealPlan.create({
      user:          req.user._id,
      healthProfile: profile._id,
      title: `Week ${progress.weekNumber + 1} Plan — ${startDate.toLocaleDateString('en-PK', {
        weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
      })}`,
      startDate,
      ...planData,
    });

    // Fetch real-time prices
    let populated = await MealPlan.findById(newPlan._id).populate(
      'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem'
    );
    try {
      const updatedPlan = await updateMealPlanPrices(populated);
      await MealPlan.findByIdAndUpdate(newPlan._id, {
        days: updatedPlan.days,
        weeklyTotalCost: updatedPlan.weeklyTotalCost,
        avgDailyCost: updatedPlan.avgDailyCost,
      });
      populated = await MealPlan.findById(newPlan._id).populate(
        'days.breakfast.foodItem days.lunch.foodItem days.dinner.foodItem days.snack.foodItem'
      );
    } catch (priceErr) {
      console.warn('[Progress] Price update skipped:', priceErr.message);
    }

    // Initialize progress tracker for the new plan
    const prevCount  = await WeeklyProgress.countDocuments({ user: req.user._id });
    const newProgress = await WeeklyProgress.create({
      user:       req.user._id,
      mealPlan:   newPlan._id,
      weekNumber: prevCount + 1,
      days:       buildEmptyDays(),
    });

    return successResponse(
      res,
      { mealPlan: populated, progress: newProgress },
      `Week ${progress.weekNumber + 1} plan generated based on your health update! 🎉`,
      201
    );
  } catch (error) {
    next(error);
  }
};

module.exports = { initProgress, getCurrent, getAll, toggleMeal, submitCheckIn, regenerateAfterCheckIn };
