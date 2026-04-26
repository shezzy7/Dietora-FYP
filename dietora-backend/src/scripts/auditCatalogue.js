// scripts/auditCatalogue.js
// DIETORA — Catalogue Coverage Audit
//
// Run: node src/scripts/auditCatalogue.js
//
// For each disease (and each multi-disease combination from real users),
// reports how many safe options exist per meal slot. Highlights gaps where
// fewer than MIN_OPTIONS are available — those will trigger feasibility
// failures in the meal planner.

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const FoodItem = require('../models/FoodItem');
const connectDB = require('../config/database');

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MIN_OPTIONS = 2; // matches MIN_OPTIONS_PER_SLOT in nodes.js
const HEALTHY_TARGET = 5; // recommended floor for variety

const DISEASES = [
  { key: 'isDiabetic',       flag: 'is_diabetic_safe',     label: 'Diabetes' },
  { key: 'isHypertensive',   flag: 'is_hypertension_safe', label: 'Hypertension' },
  { key: 'isCardiac',        flag: 'is_cardiac_safe',      label: 'Cardiac' },
  { key: 'hasKidneyDisease', flag: 'is_kidney_safe',       label: 'Kidney' },
  { key: 'hasThyroid',       flag: 'is_thyroid_safe',      label: 'Thyroid' },
  { key: 'hasConstipation',  flag: 'is_constipation_safe', label: 'Constipation' },
  { key: 'hasAnemia',        flag: 'is_anemia_safe',       label: 'Anemia' },
];

const countBySlot = (foods, requiredFlags) => {
  const safe = foods.filter((f) => requiredFlags.every((flag) => f[flag]));
  const counts = {};
  for (const slot of MEAL_SLOTS) {
    counts[slot] = safe.filter((f) => (f.mealType || []).includes(slot)).length;
  }
  return { total: safe.length, counts };
};

const printRow = (label, total, counts) => {
  const slotStr = MEAL_SLOTS.map((s) => {
    const n = counts[s];
    const tag = n < MIN_OPTIONS ? ' ✘ FAIL' : n < HEALTHY_TARGET ? ' ⚠ THIN' : ' ✔';
    return `${s}=${String(n).padStart(2)}${tag}`;
  }).join('  ');
  console.log(`  ${label.padEnd(35)} total=${String(total).padStart(3)}  ${slotStr}`);
};

const audit = async () => {
  try {
    await connectDB();
    const foods = await FoodItem.find({ isAvailable: true }).lean();
    console.log(`\n═══ DIETORA Catalogue Audit ═══`);
    console.log(`Total available foods: ${foods.length}`);
    console.log(`Threshold: FAIL < ${MIN_OPTIONS}, THIN < ${HEALTHY_TARGET}\n`);

    // Single conditions
    console.log('─── Single conditions ─────────────────────────────────────');
    {
      const { total, counts } = countBySlot(foods, []);
      printRow('Healthy (no conditions)', total, counts);
    }
    for (const d of DISEASES) {
      const { total, counts } = countBySlot(foods, [d.flag]);
      printRow(d.label, total, counts);
    }

    // Common combinations seen in real patients
    console.log('\n─── Common combinations (real patients) ──────────────────');
    const combos = [
      { label: 'Diabetes + Hypertension',           flags: ['is_diabetic_safe', 'is_hypertension_safe'] },
      { label: 'Diabetes + Cardiac',                flags: ['is_diabetic_safe', 'is_cardiac_safe'] },
      { label: 'Diabetes + Kidney',                 flags: ['is_diabetic_safe', 'is_kidney_safe'] },
      { label: 'Hypertension + Cardiac',            flags: ['is_hypertension_safe', 'is_cardiac_safe'] },
      { label: 'Hypertension + Kidney',             flags: ['is_hypertension_safe', 'is_kidney_safe'] },
      { label: 'Cardiac + Kidney',                  flags: ['is_cardiac_safe', 'is_kidney_safe'] },
      { label: 'Diabetes + HTN + Cardiac',          flags: ['is_diabetic_safe', 'is_hypertension_safe', 'is_cardiac_safe'] },
      { label: 'Diabetes + HTN + Kidney',           flags: ['is_diabetic_safe', 'is_hypertension_safe', 'is_kidney_safe'] },
      { label: 'Diabetes + HTN + Cardiac + Kidney', flags: ['is_diabetic_safe', 'is_hypertension_safe', 'is_cardiac_safe', 'is_kidney_safe'] },
    ];
    for (const c of combos) {
      const { total, counts } = countBySlot(foods, c.flags);
      printRow(c.label, total, counts);
    }

    // Highlight critical gaps
    console.log('\n─── 🚨 Critical gaps requiring catalogue expansion ───────');
    let gapCount = 0;
    const checkAndReport = (label, requiredFlags) => {
      const { counts } = countBySlot(foods, requiredFlags);
      const failingSlots = MEAL_SLOTS.filter((s) => counts[s] < MIN_OPTIONS);
      if (failingSlots.length > 0) {
        console.log(`  ✘ ${label}: missing options for [${failingSlots.join(', ')}]`);
        gapCount += 1;
      }
    };

    for (const d of DISEASES) checkAndReport(d.label, [d.flag]);
    for (const c of combos)   checkAndReport(c.label, c.flags);

    if (gapCount === 0) {
      console.log('  ✔ No critical gaps found. Every condition can build a 7-day plan.');
    } else {
      console.log(`\n  → ${gapCount} configuration(s) will fail feasibility. Add more safe foods to fix.`);
    }

    console.log('');
    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err.message);
    process.exit(1);
  }
};

audit();
