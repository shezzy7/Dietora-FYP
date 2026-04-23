// src/models/Feedback.js

const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealPlan',
    },
    type: {
      type: String,
      enum: ['meal_plan', 'app', 'food_item', 'general'],
      default: 'general',
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: [true, 'Rating is required'],
    },
    comment: {
      type: String,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
      default: '',
    },
    category: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: [],
      // e.g. ['too_expensive', 'tasty', 'not_filling']
    },
    isResolved: {
      type: Boolean,
      default: false,
    },
    adminResponse: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Feedback', feedbackSchema);
