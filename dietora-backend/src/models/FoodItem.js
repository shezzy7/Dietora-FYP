// src/models/FoodItem.js
// Pakistani food database — core of the AI planner

const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      unique: true,
    },
    // ─── Nutritional Info (per serving) ─────────────────
    calories: {
      type: Number,
      required: [true, 'Calories are required'],
      min: 0,
    },
    protein: {
      type: Number, // grams
      required: true,
      min: 0,
    },
    carbs: {
      type: Number, // grams
      required: true,
      min: 0,
    },
    fat: {
      type: Number, // grams
      required: true,
      min: 0,
    },
    fiber: {
      type: Number, // grams
      default: 0,
    },
    // ─── Local Pricing ───────────────────────────────────
    price: {
      type: Number, // PKR per serving
      required: [true, 'Price in PKR is required'],
      min: 0,
    },
    servingSize: {
      type: String,
      default: '1 serving',
    },
    // ─── Disease Safety Flags ────────────────────────────
    is_diabetic_safe: {
      type: Boolean,
      default: false,
    },
    is_hypertension_safe: {
      type: Boolean,
      default: false,
    },
    is_cardiac_safe: {
      type: Boolean,
      default: false,
    },
    is_kidney_safe: {
      // Low potassium, low phosphorus, controlled protein
      type: Boolean,
      default: false,
    },
    is_thyroid_safe: {
      // Avoids raw goitrogens (raw cruciferous veg); cooked is fine
      type: Boolean,
      default: false,
    },
    // ─── Category & Meal Type ────────────────────────────
    category: {
      type: String,
      enum: [
        'breakfast', 'lunch', 'dinner', 'snack',
        'bread', 'rice', 'lentils', 'meat',
        'vegetable', 'dairy', 'beverage', 'fruit', 'dessert',
      ],
      required: [true, 'Category is required'],
    },
    mealType: {
      type: [String],
      enum: ['breakfast', 'lunch', 'dinner', 'snack'],
      default: ['lunch', 'dinner'],
    },
    // ─── Allergen Tags ───────────────────────────────────
    allergens: {
      type: [String],
      default: [],
    },
    // ─── Availability ────────────────────────────────────
    isAvailable: {
      type: Boolean,
      default: true,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Compound index for fast multi-condition filtering
foodItemSchema.index({
  category: 1,
  is_diabetic_safe: 1,
  is_hypertension_safe: 1,
  is_cardiac_safe: 1,
  is_kidney_safe: 1,
  is_thyroid_safe: 1,
});
foodItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('FoodItem', foodItemSchema);
