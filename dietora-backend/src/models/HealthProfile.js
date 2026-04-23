// src/models/HealthProfile.js
// 1:1 relationship with User — stores health & dietary info

const mongoose = require('mongoose');

const healthProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    age: {
      type: Number,
      required: [true, 'Age is required'],
      min: [5, 'Age must be at least 5'],
      max: [120, 'Age must be less than 120'],
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Gender is required'],
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [10, 'Weight must be at least 10 kg'],
      max: [300, 'Weight must be less than 300 kg'],
    },
    height: {
      type: Number,
      required: [true, 'Height is required'],
      min: [50, 'Height must be at least 50 cm'],
      max: [250, 'Height must be less than 250 cm'],
    },
    activityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active'],
      required: [true, 'Activity level is required'],
    },
    goal: {
      type: String,
      enum: ['weight_loss', 'weight_gain', 'maintenance'],
      required: [true, 'Goal is required'],
    },

    // ─── Onboarding Fields ──────────────────────────────
    // Why is user here? (collected during onboarding wizard)
    primaryGoalReason: {
      type: String,
      default: '',
      // e.g. 'weight_loss', 'manage_disease', 'healthy_eating', 'muscle_gain', 'other'
    },
    hasDisease: {
      type: Boolean,
      default: false,
    },
    diseaseDescription: {
      type: String,
      default: '',
      // Free text: user describes their condition in their own words
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },

    // ─── Disease Flags ──────────────────────────────────
    isDiabetic: { type: Boolean, default: false },
    isHypertensive: { type: Boolean, default: false },
    isCardiac: { type: Boolean, default: false },
    hasKidneyDisease: { type: Boolean, default: false },
    hasThyroid: { type: Boolean, default: false },

    // ─── Allergies ──────────────────────────────────────
    allergies: {
      type: [String],
      default: [],
    },

    // ─── Budget ─────────────────────────────────────────
    dailyBudget: {
      type: Number,
      required: [true, 'Daily budget is required'],
      min: [100, 'Daily budget must be at least PKR 100'],
    },

    // ─── Auto-calculated fields ─────────────────────────
    bmi: { type: Number },
    bmiCategory: {
      type: String,
      enum: ['Underweight', 'Normal', 'Overweight', 'Obese', ''],
      default: '',
    },
    bmr: { type: Number },
    tdee: { type: Number },
    dailyCalorieTarget: { type: Number },
  },
  { timestamps: true }
);

// ─── Pre-save: Auto-calculate BMI, BMR, TDEE ─────────────
healthProfileSchema.pre('save', function (next) {
  const heightInMeters = this.height / 100;
  this.bmi = parseFloat((this.weight / (heightInMeters * heightInMeters)).toFixed(2));

  if (this.bmi < 18.5) this.bmiCategory = 'Underweight';
  else if (this.bmi < 25) this.bmiCategory = 'Normal';
  else if (this.bmi < 30) this.bmiCategory = 'Overweight';
  else this.bmiCategory = 'Obese';

  if (this.gender === 'male') {
    this.bmr = Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age + 5);
  } else {
    this.bmr = Math.round(10 * this.weight + 6.25 * this.height - 5 * this.age - 161);
  }

  const activityMultipliers = {
    sedentary: 1.2,
    lightly_active: 1.375,
    moderately_active: 1.55,
    very_active: 1.725,
    extra_active: 1.9,
  };
  this.tdee = Math.round(this.bmr * activityMultipliers[this.activityLevel]);

  if (this.goal === 'weight_loss') {
    this.dailyCalorieTarget = Math.round(this.tdee - 500);
  } else if (this.goal === 'weight_gain') {
    this.dailyCalorieTarget = Math.round(this.tdee + 500);
  } else {
    this.dailyCalorieTarget = this.tdee;
  }

  next();
});

module.exports = mongoose.model('HealthProfile', healthProfileSchema);
