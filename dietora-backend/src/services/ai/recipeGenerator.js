const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { SystemMessage, HumanMessage } = require('@langchain/core/messages');

// BUG FIX: retry helper with exponential backoff for transient AI failures
const withRetry = async (fn, retries = 2, delayMs = 1000) => {
  let lastErr;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const isRetryable =
        err.status === 429 ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('network');
      if (!isRetryable || attempt > retries) break;
      const wait = delayMs * attempt;
      console.warn(`[RecipeGenerator] Attempt ${attempt} failed. Retrying in ${wait}ms...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
  throw lastErr;
};

const generateTailoredRecipe = async (foodName, healthProfile) => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is missing from .env');
  }

  const model = new ChatGoogleGenerativeAI({
    modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    apiKey: process.env.GEMINI_API_KEY,
    temperature: 0.7,
  });

  const conditions = [];
  if (healthProfile.isDiabetic)       conditions.push('Diabetes');
  if (healthProfile.isHypertensive)   conditions.push('Hypertension');
  if (healthProfile.isCardiac)        conditions.push('Cardiac Disease');
  if (healthProfile.hasKidneyDisease) conditions.push('Kidney Disease');
  if (healthProfile.hasThyroid)       conditions.push('Thyroid');

  const conditionStr = conditions.length > 0 ? conditions.join(', ') : 'No specific medical conditions';
  const allergies = healthProfile.allergies?.join(', ') || 'None';

  const systemPrompt = `You are an expert clinical dietitian and Pakistani chef.
Your task is to generate a recipe for "${foodName}" tailored to the user's specific medical conditions.
User Conditions: ${conditionStr}
User Allergies: ${allergies}

Rules:
1. Modify traditional ingredients to make it medically safe (e.g., replace sugar with stevia for diabetics, use olive oil instead of ghee for cardiac, use low sodium for hypertension).
2. Avoid ANY allergens explicitly.
3. Keep instructions concise and easy to follow.
4. Output strictly in valid JSON format. No markdown blocks outside the JSON.

Expected JSON schema:
{
  "title": "String",
  "prepTime": "String",
  "ingredients": ["String"],
  "instructions": ["String"],
  "medicalNote": "String explaining how you tailored this for their conditions."
}`;

  // BUG FIX: wrap the AI call in a retry wrapper for resilience
  return withRetry(async () => {
    const res = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(`Give me the recipe for ${foodName}.`),
    ]);

    let raw = res.content.trim();
    // Strip markdown code fences if present
    raw = raw.replace(/^```(?:json)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();

    // Sometimes the model prepends explanation text — extract the JSON object
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No valid JSON found in recipe response.');

    return JSON.parse(jsonMatch[0]);
  });
};

module.exports = { generateTailoredRecipe };
