// src/validators/feedback.validator.js
const { z } = require('zod');

const feedbackSchema = z.object({
  mealPlan: z.string().optional(),
  type: z.enum(['meal_plan', 'app', 'food_item', 'general']).default('general'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).default(''),
  category: z.string().max(100).default(''),
  tags: z.array(z.string()).default([]),
});

module.exports = { feedbackSchema };
