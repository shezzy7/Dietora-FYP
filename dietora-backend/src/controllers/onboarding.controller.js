// src/controllers/onboarding.controller.js
// Handles the post-registration onboarding wizard data

const HealthProfile = require('../models/HealthProfile');
const { successResponse } = require('../utils/response.utils');

/**
 * @route   POST /api/v1/onboarding/complete
 * @desc    Save onboarding data and create/update health profile
 * @access  Private
 */
const completeOnboarding = async (req, res, next) => {
  try {
    const {
      primaryGoalReason,
      hasDisease,
      diseaseDescription,
      isDiabetic,
      isHypertensive,
      isCardiac,
      hasKidneyDisease,
      hasThyroid,
      age,
      gender,
      weight,
      height,
      activityLevel,
      goal,
      allergies,
      dailyBudget,
    } = req.body;

    let profile = await HealthProfile.findOne({ user: req.user._id });

    const profileData = {
      user: req.user._id,
      primaryGoalReason: primaryGoalReason || 'healthy_eating',
      hasDisease: hasDisease || false,
      diseaseDescription: diseaseDescription || '',
      isDiabetic: isDiabetic || false,
      isHypertensive: isHypertensive || false,
      isCardiac: isCardiac || false,
      hasKidneyDisease: hasKidneyDisease || false,
      hasThyroid: hasThyroid || false,
      age: parseInt(age),
      gender: gender || 'male',
      weight: parseFloat(weight),
      height: parseFloat(height),
      activityLevel: activityLevel || 'moderately_active',
      goal: goal || 'maintenance',
      allergies: allergies || [],
      dailyBudget: parseInt(dailyBudget) || 500,
      onboardingCompleted: true,
    };

    if (profile) {
      Object.assign(profile, profileData);
      await profile.save();
    } else {
      profile = await HealthProfile.create(profileData);
    }

    return successResponse(res, profile, 'Onboarding completed! Welcome to DIETORA 🎉', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/onboarding/status
 * @desc    Check if user has completed onboarding
 * @access  Private
 */
const getOnboardingStatus = async (req, res, next) => {
  try {
    const profile = await HealthProfile.findOne({ user: req.user._id });
    return successResponse(res, {
      onboardingCompleted: profile?.onboardingCompleted || false,
      hasProfile: !!profile,
    }, 'Onboarding status fetched');
  } catch (error) {
    next(error);
  }
};

module.exports = { completeOnboarding, getOnboardingStatus };
