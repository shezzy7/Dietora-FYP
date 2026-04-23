// src/controllers/profile.controller.js

const HealthProfile = require('../models/HealthProfile');
const { successResponse } = require('../utils/response.utils');

// ─── Allowed fields for create/update (prevents mass assignment) ─────────────
const ALLOWED_PROFILE_FIELDS = [
  'age', 'gender', 'weight', 'height', 'activityLevel', 'goal',
  'isDiabetic', 'isHypertensive', 'isCardiac', 'hasKidneyDisease', 'hasThyroid',
  'allergies', 'dailyBudget', 'primaryGoalReason', 'hasDisease',
  'diseaseDescription', 'onboardingCompleted',
];

const pickAllowed = (body) =>
  ALLOWED_PROFILE_FIELDS.reduce((acc, key) => {
    if (key in body) acc[key] = body[key];
    return acc;
  }, {});

/**
 * @route   POST /api/v1/profile
 * @desc    Create health profile (first time)
 * @access  Private
 */
const createProfile = async (req, res, next) => {
  try {
    const existing = await HealthProfile.findOne({ user: req.user._id });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Health profile already exists. Use PUT /profile to update.',
      });
    }

    const profile = await HealthProfile.create({
      user: req.user._id,
      ...pickAllowed(req.body),  // SECURITY FIX: only allow safe fields
    });

    return successResponse(res, profile, 'Health profile created successfully!', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/profile
 * @desc    Get current user's health profile
 * @access  Private
 */
const getProfile = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id }).populate('user', 'name email');
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Health profile not found. Please create one first.',
      });
    }
    return successResponse(res, profile, 'Profile fetched successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/profile
 * @desc    Update health profile (triggers BMI/BMR/TDEE recalculation)
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    let profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Health profile not found. Please create one first.',
      });
    }

    // SECURITY FIX: only apply whitelisted fields — prevents user from
    // overriding computed fields (bmi, bmr, tdee) or the owner (user) field.
    Object.assign(profile, pickAllowed(req.body));
    await profile.save(); // triggers pre-save hook → recalculates BMI, BMR, TDEE

    return successResponse(res, profile, 'Health profile updated successfully!');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/profile/summary
 * @desc    Get a summary of BMI, BMR, TDEE, targets
 * @access  Private
 */
const getProfileSummary = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profile not found.' });
    }

    const summary = {
      bmi: profile.bmi,
      bmiCategory: profile.bmiCategory,
      bmr: profile.bmr,
      tdee: profile.tdee,
      dailyCalorieTarget: profile.dailyCalorieTarget,
      dailyBudget: profile.dailyBudget,
      goal: profile.goal,
      healthFlags: {
        isDiabetic: profile.isDiabetic,
        isHypertensive: profile.isHypertensive,
        isCardiac: profile.isCardiac,
      },
      allergies: profile.allergies,
    };

    return successResponse(res, summary, 'Profile summary fetched successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { createProfile, getProfile, updateProfile, getProfileSummary };
