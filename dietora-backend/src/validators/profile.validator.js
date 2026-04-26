// src/validators/profile.validator.js
const { z } = require('zod');

const profileSchema = z.object({
  age: z.number().int().min(5).max(120),
  gender: z.enum(['male', 'female']),
  weight: z.number().min(10).max(300),
  height: z.number().min(50).max(250),
  activityLevel: z.enum([
    'sedentary',
    'lightly_active',
    'moderately_active',
    'very_active',
    'extra_active',
  ]),
  goal: z.enum(['weight_loss', 'weight_gain', 'maintenance']),
  isDiabetic: z.boolean().default(false),
  isHypertensive: z.boolean().default(false),
  isCardiac: z.boolean().default(false),
  hasKidneyDisease: z.boolean().default(false),
  hasThyroid: z.boolean().default(false),
  // Additional conditions from NutriGuide Pakistan proposal
  hasConstipation: z.boolean().default(false),
  hasAnemia: z.boolean().default(false),
  hasObesity: z.boolean().default(false),
  allergies: z.array(z.string()).default([]),
  dailyBudget: z.number().min(100, 'Daily budget must be at least PKR 100'),
});

const updateProfileSchema = profileSchema.partial();

module.exports = { profileSchema, updateProfileSchema };
