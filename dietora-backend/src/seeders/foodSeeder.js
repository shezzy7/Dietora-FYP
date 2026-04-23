// src/seeders/foodSeeder.js
// Seeds 60 realistic Pakistani foods with full disease-safety flags
// Includes kidney-safe and thyroid-safe items
// Run: npm run seed

require('dotenv').config();
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const connectDB = require('../config/database');

const pakistaniFoods = [
  // ══════════════════════════════════════════════════════
  // BREAKFAST ITEMS
  // ══════════════════════════════════════════════════════
  {
    name: 'Aloo Paratha',
    calories: 320, protein: 7, carbs: 48, fat: 12, fiber: 3,
    price: 50, servingSize: '2 parathas (200g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['gluten'],
    description: 'Classic Pakistani stuffed bread with spiced potato filling',
  },
  {
    name: 'Halwa Puri',
    calories: 450, protein: 8, carbs: 60, fat: 20, fiber: 2,
    price: 80, servingSize: '1 plate',
    is_diabetic_safe: false, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['gluten'],
    description: 'Traditional Pakistani Sunday breakfast — fried bread with semolina dessert',
  },
  {
    name: 'Anda Paratha',
    calories: 370, protein: 14, carbs: 45, fat: 16, fiber: 2,
    price: 60, servingSize: '1 paratha with egg (220g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['gluten', 'eggs'],
    description: 'Egg-stuffed whole wheat paratha',
  },
  {
    name: 'Doodh Pati Chai',
    calories: 120, protein: 4, carbs: 14, fat: 5, fiber: 0,
    price: 20, servingSize: '1 cup (240ml)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'beverage', mealType: ['breakfast', 'snack'],
    allergens: ['dairy'],
    description: 'Strong Pakistani milk tea',
  },
  {
    name: 'Namkeen Lassi',
    calories: 150, protein: 8, carbs: 12, fat: 7, fiber: 0,
    price: 40, servingSize: '1 glass (300ml)',
    is_diabetic_safe: true, is_hypertension_safe: false, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'beverage', mealType: ['breakfast', 'lunch'],
    allergens: ['dairy'],
    description: 'Salty yogurt-based drink, popular in Faisalabad',
  },
  {
    name: 'Meethi Lassi',
    calories: 220, protein: 8, carbs: 30, fat: 7, fiber: 0,
    price: 50, servingSize: '1 glass (300ml)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'beverage', mealType: ['breakfast'],
    allergens: ['dairy'],
    description: 'Sweet yogurt drink, Punjabi staple',
  },
  {
    name: 'Anday ka Nashta',
    calories: 250, protein: 18, carbs: 5, fat: 17, fiber: 1,
    price: 55, servingSize: '2 eggs with vegetables (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: false,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['eggs'],
    description: 'Pakistani spiced scrambled eggs (bhurji) with tomatoes and onions',
  },
  {
    name: 'Khichdi',
    calories: 280, protein: 9, carbs: 52, fat: 5, fiber: 4,
    price: 45, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast', 'dinner'],
    allergens: [],
    description: 'Comforting rice and lentil porridge — gentle on stomach, kidney-friendly',
  },
  {
    name: 'Boiled Egg White Breakfast',
    calories: 100, protein: 20, carbs: 2, fat: 1, fiber: 0,
    price: 35, servingSize: '4 egg whites (160g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['eggs'],
    description: 'Boiled egg whites — high protein, low fat, cardiac and diabetic safe',
  },
  {
    name: 'Oats Porridge (Dalia)',
    calories: 210, protein: 7, carbs: 38, fat: 4, fiber: 5,
    price: 40, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['gluten'],
    description: 'Slow-cooked oat porridge — excellent for blood sugar and heart health',
  },
  {
    name: 'Sattu Sharbat',
    calories: 180, protein: 6, carbs: 35, fat: 2, fiber: 3,
    price: 30, servingSize: '1 glass (300ml)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'beverage', mealType: ['breakfast', 'snack'],
    allergens: ['gluten'],
    description: 'Roasted gram flour drink — traditional Punjabi energy drink',
  },

  // ══════════════════════════════════════════════════════
  // BREAD
  // ══════════════════════════════════════════════════════
  {
    name: 'Tandoori Roti',
    calories: 120, protein: 4, carbs: 24, fat: 1, fiber: 2,
    price: 15, servingSize: '1 roti (90g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'bread', mealType: ['lunch', 'dinner'],
    allergens: ['gluten'],
    description: 'Whole wheat flatbread baked in tandoor oven',
  },
  {
    name: 'Chapati (Phulka)',
    calories: 100, protein: 3, carbs: 20, fat: 1, fiber: 2,
    price: 10, servingSize: '1 chapati (70g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'bread', mealType: ['lunch', 'dinner'],
    allergens: ['gluten'],
    description: 'Thin whole wheat flatbread cooked on tawa',
  },
  {
    name: 'Naan',
    calories: 260, protein: 8, carbs: 48, fat: 4, fiber: 2,
    price: 25, servingSize: '1 naan (150g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'bread', mealType: ['lunch', 'dinner'],
    allergens: ['gluten', 'dairy'],
    description: 'Leavened tandoor-baked bread',
  },

  // ══════════════════════════════════════════════════════
  // LENTILS
  // ══════════════════════════════════════════════════════
  {
    name: 'Dal Masoor',
    calories: 230, protein: 15, carbs: 38, fat: 3, fiber: 8,
    price: 60, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'lentils', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Red lentil curry — most common Pakistani household dal',
  },
  {
    name: 'Dal Mash',
    calories: 210, protein: 14, carbs: 32, fat: 4, fiber: 7,
    price: 70, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'lentils', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'White lentil curry, Punjabi specialty',
  },
  {
    name: 'Dal Chana',
    calories: 250, protein: 13, carbs: 42, fat: 4, fiber: 9,
    price: 65, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'lentils', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Split chickpea lentil curry',
  },
  {
    name: 'Chana Masala',
    calories: 270, protein: 14, carbs: 40, fat: 6, fiber: 10,
    price: 80, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'lentils', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Spiced chickpea curry — protein-rich Pakistani staple',
  },
  {
    name: 'Moong Dal (Yellow)',
    calories: 190, protein: 12, carbs: 30, fat: 2, fiber: 6,
    price: 55, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'lentils', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Yellow split mung beans — lightest dal, kidney-friendly, easy to digest',
  },

  // ══════════════════════════════════════════════════════
  // MEAT DISHES
  // ══════════════════════════════════════════════════════
  {
    name: 'Chicken Karahi',
    calories: 380, protein: 32, carbs: 8, fat: 24, fiber: 2,
    price: 200, servingSize: '1 serving (300g)',
    is_diabetic_safe: true, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Classic Pakistani wok-cooked spicy chicken — Faisalabad style',
  },
  {
    name: 'Chicken Roast (Desi)',
    calories: 340, protein: 35, carbs: 5, fat: 20, fiber: 1,
    price: 180, servingSize: '2 pieces (250g)',
    is_diabetic_safe: true, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Spiced whole roasted chicken pieces',
  },
  {
    name: 'Beef Qeema',
    calories: 360, protein: 28, carbs: 6, fat: 25, fiber: 2,
    price: 160, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Minced beef curry with peas — Pakistani household staple',
  },
  {
    name: 'Mutton Karahi',
    calories: 420, protein: 30, carbs: 6, fat: 30, fiber: 2,
    price: 280, servingSize: '1 serving (300g)',
    is_diabetic_safe: true, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Rich mutton karahi — special occasion dish in Faisalabad',
  },
  {
    name: 'Chicken Tikka (Grilled)',
    calories: 290, protein: 38, carbs: 4, fat: 13, fiber: 1,
    price: 220, servingSize: '4 pieces (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner', 'snack'],
    allergens: ['dairy'],
    description: 'Yogurt-marinated grilled chicken — healthier option',
  },
  {
    name: 'Steamed Fish (Rohu)',
    calories: 180, protein: 30, carbs: 0, fat: 5, fiber: 0,
    price: 150, servingSize: '1 fillet (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Steamed freshwater fish — excellent for cardiac, kidney, and thyroid patients',
  },
  {
    name: 'Chicken Soup (Yakhni)',
    calories: 140, protein: 20, carbs: 5, fat: 4, fiber: 1,
    price: 80, servingSize: '1 bowl (300ml)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Clear bone broth chicken soup — gentle, healing, multi-condition safe',
  },
  {
    name: 'Grilled Chicken Breast',
    calories: 220, protein: 40, carbs: 2, fat: 5, fiber: 0,
    price: 200, servingSize: '1 breast (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Plain grilled chicken breast — lean protein, heart and diabetes safe',
  },

  // ══════════════════════════════════════════════════════
  // VEGETABLES & SABZI
  // ══════════════════════════════════════════════════════
  {
    name: 'Saag (Sarson)',
    calories: 180, protein: 8, carbs: 20, fat: 8, fiber: 6,
    price: 70, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: false,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: ['dairy'],
    description: 'Mustard greens cooked with butter — iconic Punjabi dish. Note: raw goitrogen; not ideal for uncontrolled thyroid',
  },
  {
    name: 'Aloo Gosht',
    calories: 350, protein: 22, carbs: 25, fat: 18, fiber: 3,
    price: 150, servingSize: '1 bowl (300g)',
    is_diabetic_safe: false, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Potato and mutton curry — beloved Pakistani comfort food',
  },
  {
    name: 'Bhindi Masala',
    calories: 150, protein: 4, carbs: 18, fat: 7, fiber: 5,
    price: 60, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Spiced okra stir-fry — diabetic-friendly, kidney-safe low potassium vegetable',
  },
  {
    name: 'Karela (Bitter Gourd)',
    calories: 90, protein: 3, carbs: 12, fat: 3, fiber: 4,
    price: 50, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Bitter gourd sabzi — excellent blood sugar control, kidney and thyroid safe',
  },
  {
    name: 'Tinda Masala',
    calories: 120, protein: 3, carbs: 16, fat: 5, fiber: 3,
    price: 55, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Indian round gourd — low potassium, kidney-friendly, thyroid safe',
  },
  {
    name: 'Palak Paneer',
    calories: 280, protein: 14, carbs: 18, fat: 17, fiber: 4,
    price: 120, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: false,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: ['dairy'],
    description: 'Spinach and cottage cheese curry. Cooked spinach reduces goitrogens but still moderate thyroid concern',
  },
  {
    name: 'Lauki (Bottle Gourd) Sabzi',
    calories: 80, protein: 2, carbs: 12, fat: 3, fiber: 3,
    price: 45, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Bottle gourd curry — extremely low potassium and phosphorus, ideal for kidney patients',
  },
  {
    name: 'Turai (Ridge Gourd) Sabzi',
    calories: 75, protein: 2, carbs: 10, fat: 3, fiber: 3,
    price: 45, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Ridge gourd curry — very low mineral content, safe for kidney disease',
  },
  {
    name: 'Aloo Matar',
    calories: 180, protein: 5, carbs: 30, fat: 5, fiber: 4,
    price: 65, servingSize: '1 bowl (250g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'vegetable', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Potato and peas curry — common Pakistani sabzi',
  },
  {
    name: 'Gajar Gosht (Carrot Curry)',
    calories: 260, protein: 18, carbs: 22, fat: 10, fiber: 5,
    price: 120, servingSize: '1 bowl (250g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Carrot and mutton curry — vitamin A rich, heart-healthy',
  },

  // ══════════════════════════════════════════════════════
  // RICE DISHES
  // ══════════════════════════════════════════════════════
  {
    name: 'Plain Boiled Rice',
    calories: 200, protein: 4, carbs: 44, fat: 0.5, fiber: 1,
    price: 30, servingSize: '1 cup cooked (180g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'rice', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Simple steamed white rice — low phosphorus, kidney-safe in moderation',
  },
  {
    name: 'Chicken Biryani',
    calories: 480, protein: 25, carbs: 65, fat: 14, fiber: 2,
    price: 180, servingSize: '1 plate (350g)',
    is_diabetic_safe: false, is_hypertension_safe: false, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'rice', mealType: ['lunch', 'dinner'],
    allergens: ['dairy'],
    description: 'Aromatic Pakistani chicken biryani — Faisalabad celebration food',
  },
  {
    name: 'Matar Pulao',
    calories: 320, protein: 9, carbs: 58, fat: 7, fiber: 4,
    price: 80, servingSize: '1 plate (300g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'rice', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Fragrant peas and rice pilaf',
  },
  {
    name: 'Brown Rice (Unpolished)',
    calories: 215, protein: 5, carbs: 45, fat: 2, fiber: 3,
    price: 40, servingSize: '1 cup cooked (180g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'rice', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Whole grain brown rice — lower glycemic, more fiber than white rice',
  },

  // ══════════════════════════════════════════════════════
  // DAIRY
  // ══════════════════════════════════════════════════════
  {
    name: 'Dahi (Plain Yogurt)',
    calories: 120, protein: 9, carbs: 10, fat: 4, fiber: 0,
    price: 40, servingSize: '1 cup (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'dairy', mealType: ['breakfast', 'lunch', 'dinner', 'snack'],
    allergens: ['dairy'],
    description: 'Plain Pakistani yogurt — probiotic rich, low fat',
  },
  {
    name: 'Raita',
    calories: 100, protein: 5, carbs: 10, fat: 4, fiber: 1,
    price: 30, servingSize: '1 cup (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'dairy', mealType: ['lunch', 'dinner'],
    allergens: ['dairy'],
    description: 'Yogurt with cucumber and mint',
  },
  {
    name: 'Low-Fat Milk (1 glass)',
    calories: 100, protein: 8, carbs: 12, fat: 2, fiber: 0,
    price: 30, servingSize: '1 glass (250ml)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'dairy', mealType: ['breakfast', 'snack'],
    allergens: ['dairy'],
    description: 'Low-fat dairy milk — good protein source with reduced saturated fat',
  },

  // ══════════════════════════════════════════════════════
  // SNACKS
  // ══════════════════════════════════════════════════════
  {
    name: 'Samosa (Baked)',
    calories: 180, protein: 5, carbs: 25, fat: 7, fiber: 2,
    price: 30, servingSize: '2 pieces (120g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'snack', mealType: ['snack'],
    allergens: ['gluten'],
    description: 'Baked (not fried) spiced potato pastry — lighter option',
  },
  {
    name: 'Fruit Chaat',
    calories: 130, protein: 2, carbs: 30, fat: 1, fiber: 4,
    price: 60, servingSize: '1 bowl (200g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'snack', mealType: ['snack'],
    allergens: [],
    description: 'Mixed seasonal fruits with chaat masala — Pakistani street snack',
  },
  {
    name: 'Roasted Chana',
    calories: 170, protein: 10, carbs: 25, fat: 3, fiber: 7,
    price: 25, servingSize: '1 handful (50g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'snack', mealType: ['snack'],
    allergens: [],
    description: 'Dry roasted chickpeas — healthy high-protein snack',
  },
  {
    name: 'Seasonal Fruit (Mixed)',
    calories: 90, protein: 1, carbs: 22, fat: 0.5, fiber: 3,
    price: 50, servingSize: '1 serving (150g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'fruit', mealType: ['breakfast', 'snack'],
    allergens: [],
    description: 'Seasonal fruits: guava, mango, banana, papaya — local Faisalabad produce',
  },
  {
    name: 'Apple (1 medium)',
    calories: 80, protein: 0.5, carbs: 21, fat: 0.3, fiber: 4,
    price: 35, servingSize: '1 medium apple (180g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'fruit', mealType: ['snack', 'breakfast'],
    allergens: [],
    description: 'Fresh apple — low glycemic, low potassium for kidney patients, thyroid safe',
  },
  {
    name: 'Guava (Amrood)',
    calories: 70, protein: 2, carbs: 15, fat: 0.5, fiber: 5,
    price: 25, servingSize: '1 medium guava (150g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'fruit', mealType: ['snack'],
    allergens: [],
    description: 'Pakistani guava — very high fiber, low potassium, excellent for all conditions',
  },
  {
    name: 'Mixed Nuts (Small Portion)',
    calories: 160, protein: 5, carbs: 8, fat: 14, fiber: 2,
    price: 80, servingSize: '30g mixed almonds and walnuts',
    is_diabetic_safe: true, is_hypertension_safe: false, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'snack', mealType: ['snack'],
    allergens: ['nuts'],
    description: 'Heart-healthy fats — but high sodium caution for hypertension; high phosphorus avoid in kidney disease',
  },
  {
    name: 'Cucumber Salad (Kheera)',
    calories: 30, protein: 1, carbs: 6, fat: 0.5, fiber: 2,
    price: 20, servingSize: '1 bowl (200g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'snack', mealType: ['snack', 'lunch', 'dinner'],
    allergens: [],
    description: 'Fresh cucumber salad — zero-guilt snack, safe for all conditions',
  },
  {
    name: 'Boiled Potato (Plain)',
    calories: 140, protein: 3, carbs: 32, fat: 0.5, fiber: 3,
    price: 25, servingSize: '1 medium potato (150g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'snack', mealType: ['snack', 'breakfast'],
    allergens: [],
    description: 'Plain boiled potato — leaching removes potassium for kidney patients (not pre-leached, so marked not kidney safe as default)',
  },
  {
    name: 'Green Tea',
    calories: 5, protein: 0, carbs: 1, fat: 0, fiber: 0,
    price: 15, servingSize: '1 cup (240ml)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'beverage', mealType: ['breakfast', 'snack'],
    allergens: [],
    description: 'Green tea — antioxidant rich, zero calories, safe for all conditions',
  },

  // ══════════════════════════════════════════════════════
  // KIDNEY-SPECIFIC SAFE MEALS
  // ══════════════════════════════════════════════════════
  {
    name: 'Rice Porridge with Egg White',
    calories: 200, protein: 15, carbs: 30, fat: 2, fiber: 1,
    price: 50, servingSize: '1 bowl (300g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast'],
    allergens: ['eggs'],
    description: 'Soft rice congee with egg whites — ideal for kidney patients needing controlled protein and low minerals',
  },
  {
    name: 'Lauki Dal (Low Protein)',
    calories: 150, protein: 6, carbs: 25, fat: 3, fiber: 4,
    price: 50, servingSize: '1 bowl (250g)',
    is_diabetic_safe: true, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: true, is_thyroid_safe: true,
    category: 'lentils', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Bottle gourd with minimal lentils — specially designed for CKD patients with controlled protein',
  },

  // ══════════════════════════════════════════════════════
  // THYROID-SPECIFIC SAFE MEALS
  // ══════════════════════════════════════════════════════
  {
    name: 'Roasted Chicken with Rice',
    calories: 380, protein: 30, carbs: 42, fat: 8, fiber: 2,
    price: 180, servingSize: '1 plate (350g)',
    is_diabetic_safe: false, is_hypertension_safe: false, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Lightly spiced roasted chicken with plain rice — thyroid safe, no goitrogens',
  },
  {
    name: 'Egg and Rice Bowl',
    calories: 320, protein: 18, carbs: 40, fat: 10, fiber: 1,
    price: 70, servingSize: '1 bowl (300g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: false,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'breakfast', mealType: ['breakfast', 'lunch'],
    allergens: ['eggs'],
    description: 'Cooked egg over plain rice — simple, filling, thyroid-safe meal',
  },
  {
    name: 'Cooked Carrots with Chicken',
    calories: 250, protein: 25, carbs: 18, fat: 8, fiber: 4,
    price: 140, servingSize: '1 plate (280g)',
    is_diabetic_safe: false, is_hypertension_safe: true, is_cardiac_safe: true,
    is_kidney_safe: false, is_thyroid_safe: true,
    category: 'meat', mealType: ['lunch', 'dinner'],
    allergens: [],
    description: 'Cooked chicken with carrots — no goitrogens, iodine-neutral, thyroid-safe',
  },
];

const seedFoods = async () => {
  try {
    await connectDB();

    const existingCount = await FoodItem.countDocuments();
    if (existingCount > 0) {
      console.log(`\n⚠️  Database already has ${existingCount} food items.`);
      console.log('   Clearing and reseeding with extended catalogue...\n');
      await FoodItem.deleteMany({});
    }

    const inserted = await FoodItem.insertMany(pakistaniFoods);
    console.log(`\n✅ Successfully seeded ${inserted.length} Pakistani food items!\n`);

    // Summary
    const categories = [...new Set(pakistaniFoods.map((f) => f.category))];
    console.log('📦 Categories seeded:', categories.join(', '));
    console.log('🩸 Diabetic-safe items:', pakistaniFoods.filter((f) => f.is_diabetic_safe).length);
    console.log('❤️  Cardiac-safe items:', pakistaniFoods.filter((f) => f.is_cardiac_safe).length);
    console.log('💉 Hypertension-safe items:', pakistaniFoods.filter((f) => f.is_hypertension_safe).length);
    console.log('🫘 Kidney-safe items:', pakistaniFoods.filter((f) => f.is_kidney_safe).length);
    console.log('🦋 Thyroid-safe items:', pakistaniFoods.filter((f) => f.is_thyroid_safe).length);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
};

seedFoods();
