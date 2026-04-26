// src/services/ai/recipeGenerator.js
// DIETORA — Tailored Recipe Generator (Groq: llama-3.3-70b-versatile)

'use strict';

const { ChatGroq } = require('@langchain/groq');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

const withRetry = async (fn, maxAttempts = 3, baseDelayMs = 1500) => {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isTransient =
        err.status === 429 ||
        err.status === 503 ||
        err.message?.includes('rate_limit') ||
        err.message?.includes('overloaded') ||
        err.message?.includes('network') ||
        err.message?.includes('UNAVAILABLE');

      if (!isTransient || attempt === maxAttempts) break;

      const delay = baseDelayMs * attempt;
      console.warn(`[RecipeGenerator] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
};

/**
 * Generate a medically tailored recipe using Groq (llama-3.3-70b-versatile).
 *
 * @param {string} foodName      - The food to generate a recipe for
 * @param {Object} healthProfile - User's health profile (lean object)
 * @returns {Object}             - { title, prepTime, ingredients, instructions, medicalNote }
 */
const generateTailoredRecipe = async (foodName, healthProfile) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing from .env');

  const model = new ChatGroq({
    model:       'llama-3.3-70b-versatile',
    apiKey,
    temperature: 0.6,
    maxTokens:   1024,
  });

  const conditions = [
    healthProfile.isDiabetic       && 'Diabetes',
    healthProfile.isHypertensive   && 'Hypertension',
    healthProfile.isCardiac        && 'Cardiac Disease',
    healthProfile.hasKidneyDisease && 'Kidney Disease',
    healthProfile.hasThyroid       && 'Thyroid Disorder',
  ].filter(Boolean);

  const conditionStr = conditions.length ? conditions.join(', ') : 'No specific medical conditions';
  const allergies    = healthProfile.allergies?.join(', ') || 'None';

  const systemPrompt = `You are an expert clinical dietitian and Pakistani chef.
Generate a recipe for "${foodName}" tailored to the user's medical profile.

User Conditions: ${conditionStr}
User Allergies: ${allergies}

Rules:
1. Modify ingredients to make the dish medically safe:
   - Diabetes: replace sugar with stevia/erythritol; use low-GI ingredients
   - Hypertension: no added salt; use herbs/lemon for flavour
   - Cardiac: replace ghee/butter with olive oil or minimal canola; avoid fried methods
   - Kidney Disease: limit protein; avoid high-potassium foods (bananas, tomatoes in excess)
   - Thyroid: avoid raw goitrogenic foods (cabbage, broccoli if hypothyroid); limit soy
2. Avoid ALL listed allergens.
3. Keep instructions concise and practical for a Pakistani home kitchen.
4. Return ONLY valid JSON — no markdown, no backticks, no text before or after.

JSON schema:
{
  "title": "string",
  "prepTime": "string (e.g. 25 minutes)",
  "ingredients": ["string"],
  "instructions": ["string"],
  "medicalNote": "string — brief explanation of how recipe was adapted for the conditions"
}`;

  return withRetry(async () => {
    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Give me the tailored recipe for ${foodName}.`),
    ]);

    let raw = response.content.trim();

    raw = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`No valid JSON found in recipe response. Raw (first 300 chars): ${raw.slice(0, 300)}`);
    }

    return JSON.parse(jsonMatch[0]);
  });
};

module.exports = { generateTailoredRecipe };
