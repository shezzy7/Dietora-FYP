// src/seeders/updateFoodPrices.js
// Run AFTER foodSeeder.js to update all food item prices to realistic 2026 values.
// Source: UrduPoint Faisalabad market, chickenratetoday.pk, April 2026 research
// Usage: node src/seeders/updateFoodPrices.js

require('dotenv').config();
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const connectDB = require('../config/database');

// ─── Realistic April 2026 Faisalabad serving-level prices ───────
// These are what ONE person pays at a local dhaba or home kitchen
const CORRECT_PRICES = {
  // Breakfast
  'Aloo Paratha':               130,
  'Halwa Puri':                 150,
  'Anda Paratha':               140,
  'Doodh Pati Chai':             30,
  'Namkeen Lassi':               70,
  'Meethi Lassi':                80,
  'Anday ka Nashta':             90,
  'Khichdi':                     70,
  'Boiled Egg White Breakfast':  60,
  'Oats Porridge (Dalia)':       60,
  'Sattu Sharbat':               40,
  'Egg and Rice Bowl':          100,
  'Nihari with Naan':           250,
  'Paye (Trotters Soup)':       180,
  // Bread
  'Tandoori Roti':               25,
  'Chapati (Phulka)':            15,
  'Naan':                        40,
  'Paratha (Plain)':             50,
  'Missi Roti':                  25,
  'Bajra Roti':                  20,
  // Daal
  'Dal Masoor':                 100,
  'Dal Mash':                   120,
  'Dal Chana':                  110,
  'Chana Masala':               120,
  'Moong Dal (Yellow)':          95,
  'Kala Chana':                 110,
  'Dal Makhani':                140,
  'Lauki Dal (Low Protein)':     85,
  // Meat
  'Chicken Karahi':             420,
  'Chicken Roast (Desi)':       380,
  'Beef Qeema':                 320,
  'Mutton Karahi':              550,
  'Chicken Tikka (Grilled)':    400,
  'Steamed Fish (Rohu)':        280,
  'Chicken Soup (Yakhni)':      150,
  'Grilled Chicken Breast':     350,
  'Chapli Kebab':               200,
  'Seekh Kebab':                180,
  'Beef Nihari':                280,
  'Aloo Gosht':                 270,
  'Karahi Gosht':               580,
  'Shami Kebab':                150,
  'Chicken Korma':              400,
  'Liver (Kaleji) Masala':      200,
  'Fish Karahi (Machli)':       360,
  'Roasted Chicken with Rice':  350,
  'Cooked Carrots with Chicken':280,
  'Gajar Gosht (Carrot Curry)': 270,
  'Kadu (Pumpkin) Gosht':       250,
  'Shaljam Gosht':              230,
  'Aloo Keema':                 260,
  // Vegetables
  'Saag (Sarson ka)':           120,
  'Bhindi Masala':               90,
  'Karela (Bitter Gourd)':       85,
  'Tinda Masala':                85,
  'Palak Sabzi (Spinach)':       90,
  'Lauki (Bottle Gourd) Sabzi':  80,
  'Turai (Ridge Gourd) Sabzi':   80,
  'Aloo Matar':                 100,
  'Baingan Bharta':              95,
  'Gobi Masala (Cauliflower)':   90,
  'Aloo Gobi':                  100,
  'Palak Paneer':               180,
  'Methi (Fenugreek) Sabzi':     90,
  'Arvi (Taro Root) Masala':     90,
  'Band Gobi (Cabbage) Sabzi':   75,
  // Rice
  'Plain Boiled Rice':           60,
  'Chicken Biryani':            280,
  'Mutton Biryani':             380,
  'Matar Pulao':                130,
  'Brown Rice (Unpolished)':     75,
  'Yakhni Pulao':               220,
  // Dairy
  'Dahi (Plain Yogurt)':         70,
  'Raita':                       55,
  'Low-Fat Milk (1 glass)':      55,
  'Paneer (Cottage Cheese)':    150,
  // Snacks
  'Samosa (Baked)':              60,
  'Fruit Chaat':                100,
  'Roasted Chana':               40,
  'Cucumber Salad (Kheera)':     35,
  'Green Tea':                   30,
  'Pakora (Besan)':              70,
  'Gol Gappa (Pani Puri)':       50,
  'Chana Chaat':                 90,
  'Mixed Nuts (Small Portion)': 120,
  // Fruits
  'Apple (1 medium)':            60,
  'Guava (Amrood)':              40,
  'Banana':                      30,
  'Papaya (Papita)':             50,
  'Mango (Aam)':                100,
  'Kinnow (Citrus)':             40,
  'Watermelon (Tarbooz)':        40,
  'Pomegranate (Anar)':         120,
  'Dates (Khajoor)':            130,
  'Grapes (Angoor)':             90,
  'Pear (Naashpati)':            60,
  'Strawberry (Strawberry)':    110,
  // Desserts
  'Gajar Halwa':                110,
  'Kheer (Rice Pudding)':       100,
  'Sewaiyan (Vermicelli Pudding)': 90,
  'Zarda (Sweet Rice)':         110,
  // Kidney/special
  'Rice Porridge with Egg White':  80,
};

const updatePrices = async () => {
  try {
    await connectDB();

    let updated = 0;
    let notFound = [];

    for (const [name, price] of Object.entries(CORRECT_PRICES)) {
      const result = await FoodItem.updateOne({ name }, { $set: { price } });
      if (result.matchedCount > 0) {
        updated++;
        console.log(`✅ ${name}: PKR ${price}`);
      } else {
        notFound.push(name);
      }
    }

    console.log(`\n✅ Updated ${updated} food items with correct 2026 prices.`);
    if (notFound.length) {
      console.log(`⚠️  Not found in DB (${notFound.length}): ${notFound.join(', ')}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('❌ Price update failed:', err.message);
    process.exit(1);
  }
};

updatePrices();
