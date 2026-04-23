// src/models/WeeklyProgress.js
// Tracks daily meal check-offs and end-of-week health check-ins

const mongoose = require('mongoose');

// Per-meal completion record
const mealCompletionSchema = new mongoose.Schema(
  {
    mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
  },
  { _id: false }
);

// Per-day completion record
const dayCompletionSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true }, // 1-7
    dayName: { type: String },
    meals: [mealCompletionSchema],
    allCompleted: { type: Boolean, default: false },
    caloriesConsumed: { type: Number, default: 0 },
    costSpent: { type: Number, default: 0 },
    completedAt: { type: Date },
  },
  { _id: false }
);

const weeklyProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
      required: true,
    },
    weekNumber: { type: Number, default: 1 }, // which week iteration

    // Daily check-off data (7 days)
    days: [dayCompletionSchema],

    // Overall progress
    totalMeals: { type: Number, default: 28 },       // 4 meals × 7 days
    completedMeals: { type: Number, default: 0 },
    adherencePercent: { type: Number, default: 0 },  // completedMeals/totalMeals × 100

    // End-of-week health check-in (filled after day 7)
    weekCompleted: { type: Boolean, default: false },
    checkInCompleted: { type: Boolean, default: false },

    // User's end-of-week self-report
    checkIn: {
      energyLevel: { type: String, enum: ['very_low', 'low', 'moderate', 'high', 'very_high', ''], default: '' },
      weightChange: { type: String, enum: ['lost', 'maintained', 'gained', ''], default: '' },
      currentWeight: { type: Number },           // updated weight in kg
      digestiveHealth: { type: String, enum: ['poor', 'fair', 'good', 'excellent', ''], default: '' },
      overallFeeling: { type: String, enum: ['much_worse', 'worse', 'same', 'better', 'much_better', ''], default: '' },
      diseaseSymptoms: { type: String, default: '' }, // free text about symptoms
      notes: { type: String, default: '' },
      submittedAt: { type: Date },
    },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
  },
  { timestamps: true }
);

// Auto set endDate = startDate + 7 days
weeklyProgressSchema.pre('save', function (next) {
  if (this.startDate && !this.endDate) {
    this.endDate = new Date(this.startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
  }
  // Recalculate adherence
  const done = this.days.reduce((sum, d) => sum + d.meals.filter((m) => m.completed).length, 0);
  this.completedMeals = done;
  const total = this.days.reduce((sum, d) => sum + d.meals.length, 0) || 28;
  this.totalMeals = total;
  this.adherencePercent = Math.round((done / total) * 100);
  next();
});

module.exports = mongoose.model('WeeklyProgress', weeklyProgressSchema);
