// src/services/ai/mealPlanner/nodes.js
// DIETORA — LangGraph Nodes (Groq: llama-3.3-70b-versatile)
//
// Bug fixes:
//  1. LLM receives a numbered catalogue and returns integer IDs — not food names.
//     IDs are resolved to exact names in code, so name-mismatch is impossible.
//  2. Validator detects combined-food strings ("X and Y") explicitly.
//  3. Validator uses 3-tier fuzzy lookup as a last-resort safety net.
//  4. idToFood is stored in proper LangGraph state (not a closure hack).

'use strict';

const { ChatGroq } = require('@langchain/groq');
const { z } = require('zod');

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const ClinicalAnalysisSchema = z.object({
  conditionSeverity:    z.record(z.string(), z.string()),
  dailyNutrientTargets: z.object({
    calories:     z.number(),
    proteinGrams: z.number(),
    carbsGrams:   z.number(),
    fatGrams:     z.number(),
    sodiumMg:     z.number(),
    fiberGrams:   z.number(),
  }),
  dietaryPriorities: z.array(z.string()).max(5),
  foodsToEmphasise:  z.array(z.string()).max(5),
  foodsToAvoid:      z.array(z.string()).max(5),
  mealTimingAdvice:  z.string(),
  clinicalRationale: z.string(),
});

// LLM returns integer IDs per slot
const DayIdPlanSchema = z.object({
  day:       z.number().int().min(1).max(7),
  breakfast: z.union([z.number().int().positive(), z.null()]),
  lunch:     z.union([z.number().int().positive(), z.null()]),
  dinner:    z.union([z.number().int().positive(), z.null()]),
  snack:     z.union([z.number().int().positive(), z.null()]),
});

// After ID resolution, slots hold food names (strings)
const DayNamePlanSchema = z.object({
  day:       z.number().int().min(1).max(7),
  breakfast: z.string().nullable(),
  lunch:     z.string().nullable(),
  dinner:    z.string().nullable(),
  snack:     z.string().nullable(),
});

const IdMealPlanSchema   = z.array(DayIdPlanSchema).length(7);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractJSON = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Groq');
  }

  let cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const arrayMatch  = cleaned.match(/\[[\s\S]*\]/);
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);

  if (cleaned.startsWith('[') && arrayMatch) return arrayMatch[0];
  if (objectMatch) return objectMatch[0];
  if (arrayMatch)  return arrayMatch[0];

  throw new Error(`No JSON found in response. Raw (first 300 chars): ${cleaned.slice(0, 300)}`);
};

const repairTruncatedJSON = (text) => {
  try {
    JSON.parse(text);
    return text;
  } catch {
    const stack = [];
    let inString = false;
    let escape   = false;

    for (const ch of text) {
      if (escape)          { escape = false; continue; }
      if (ch === '\\')     { escape = true;  continue; }
      if (ch === '"')      { inString = !inString; continue; }
      if (inString)        continue;
      if (ch === '{')      stack.push('}');
      else if (ch === '[') stack.push(']');
      else if (ch === '}' || ch === ']') stack.pop();
    }

    let repaired = text
      .replace(/,\s*$/, '')
      .replace(/,\s*"[^"]*$/, '')
      .replace(/:\s*"[^"]*$/, '');

    if (inString) repaired += '"';
    while (stack.length > 0) repaired += stack.pop();
    return repaired;
  }
};

const buildModel = (temperature = 0.1, maxTokens = 4096) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing from .env');
  return new ChatGroq({ model: 'llama-3.3-70b-versatile', apiKey, temperature, maxTokens });
};

/**
 * 3-tier fuzzy food lookup:
 *   Tier 1 — exact match (case-insensitive)
 *   Tier 2 — substring containment
 *   Tier 3 — token overlap >= 60%
 */
const fuzzyFindFood = (name, foodMap) => {
  if (!name) return null;
  const lower = name.toLowerCase().trim();

  if (foodMap.has(lower)) return foodMap.get(lower);

  for (const [key, food] of foodMap.entries()) {
    if (key.includes(lower) || lower.includes(key)) return food;
  }

  const qTokens = new Set(lower.split(/\s+/));
  let best = null, bestScore = 0;
  for (const [key, food] of foodMap.entries()) {
    const kTokens = key.split(/\s+/);
    const matches = kTokens.filter((t) => qTokens.has(t)).length;
    const score   = matches / Math.max(kTokens.length, qTokens.size);
    if (score > bestScore && score >= 0.6) { bestScore = score; best = food; }
  }
  return best;
};

// ─── NODE 1: AnalyzeHealthProfile ─────────────────────────────────────────────

const analyzeHealthProfileNode = async (state) => {
  console.log('[LangGraph] ▶ Node: AnalyzeHealthProfile');

  const { profile, checkInFeedback } = state;
  const model = buildModel(0.1, 1024);

  const diseases = [
    profile.isDiabetic       && 'Diabetes',
    profile.isHypertensive   && 'Hypertension',
    profile.isCardiac        && 'Cardiac Disease',
    profile.hasKidneyDisease && 'Kidney Disease',
    profile.hasThyroid       && 'Thyroid Disorder',
  ].filter(Boolean).join(', ') || 'None';

  const allergies   = profile.allergies?.length ? profile.allergies.join(', ') : 'None';
  const feedbackText = checkInFeedback ? JSON.stringify(checkInFeedback) : 'No previous check-in feedback';

  const prompt = `You are a board-certified clinical dietitian. Analyze this patient and return a clinical dietary assessment.

PATIENT:
- Age: ${profile.age} | Gender: ${profile.gender}
- Weight: ${profile.weight}kg | Height: ${profile.height}cm | BMI: ${profile.bmi}
- Goal: ${profile.goal}
- Daily Calorie Target: ${profile.dailyCalorieTarget} kcal
- Medical Conditions: ${diseases}
- Allergies: ${allergies}
- Weekly Check-in Feedback: ${feedbackText}

Return ONLY a raw JSON object — no markdown, no backticks, no explanation:
{
  "conditionSeverity": { "condition_name": "mild|moderate|severe" },
  "dailyNutrientTargets": {
    "calories": <number>,
    "proteinGrams": <number>,
    "carbsGrams": <number>,
    "fatGrams": <number>,
    "sodiumMg": <number>,
    "fiberGrams": <number>
  },
  "dietaryPriorities": ["priority1", "priority2", "priority3"],
  "foodsToEmphasise": ["food1", "food2", "food3"],
  "foodsToAvoid": ["food1", "food2", "food3"],
  "mealTimingAdvice": "brief advice string",
  "clinicalRationale": "1-2 sentence rationale"
}`;

  const response  = await model.invoke(prompt);
  const raw       = extractJSON(response.content);
  const repaired  = repairTruncatedJSON(raw);
  const validated = ClinicalAnalysisSchema.parse(JSON.parse(repaired));

  console.log('[LangGraph] ✔ ClinicalAnalysis complete:', JSON.stringify(validated.dailyNutrientTargets));
  return { clinicalAnalysis: validated };
};

// ─── NODE 2: FilterFoods ──────────────────────────────────────────────────────

const filterFoodsNode = async (state) => {
  console.log('[LangGraph] ▶ Node: FilterFoods');

  const { profile, availableFoods } = state;
  const allergyLower = (profile.allergies || []).map((a) => a.toLowerCase());

  const safeFoods = availableFoods.filter(
    (f) => !f.allergens?.some((a) => allergyLower.includes(a.toLowerCase()))
  );

  console.log(`[LangGraph] ✔ FilterFoods: ${availableFoods.length} → ${safeFoods.length} foods after allergen filter`);
  return { availableFoods: safeFoods };
};

// ─── NODE 3: GenerateMealPlan ─────────────────────────────────────────────────

const generateMealPlanNode = async (state) => {
  const attempt = state.generationAttempts + 1;
  console.log(`[LangGraph] ▶ Node: GenerateMealPlan (Attempt ${attempt}/3)`);

  const { profile, clinicalAnalysis, availableFoods, validationErrors } = state;

  // Build ID→food map and numbered catalogue
  const idToFood  = {};
  const catalogue = availableFoods.map((f, i) => {
    const id = i + 1;
    idToFood[id] = f;

    const safeFlags = [
      f.is_diabetic_safe     && 'D',
      f.is_hypertension_safe && 'H',
      f.is_cardiac_safe      && 'C',
      f.is_kidney_safe       && 'K',
      f.is_thyroid_safe      && 'T',
    ].filter(Boolean).join('') || 'G';

    const mealTypes = (f.mealType || []).join(',');
    return `${id}|"${f.name}"|${f.calories}cal|PKR${Math.round(f.price)}|${mealTypes}|safe:${safeFlags}`;
  }).join('\n');

  const budgets = {
    breakfast: Math.round(profile.dailyBudget * 0.25),
    lunch:     Math.round(profile.dailyBudget * 0.35),
    dinner:    Math.round(profile.dailyBudget * 0.30),
    snack:     Math.round(profile.dailyBudget * 0.10),
  };

  const activeFlags = [
    profile.isDiabetic       && 'D=Diabetes (ONLY IDs with safe:D)',
    profile.isHypertensive   && 'H=Hypertension (ONLY IDs with safe:H)',
    profile.isCardiac        && 'C=Cardiac (ONLY IDs with safe:C)',
    profile.hasKidneyDisease && 'K=Kidney Disease (ONLY IDs with safe:K)',
    profile.hasThyroid       && 'T=Thyroid (ONLY IDs with safe:T)',
  ].filter(Boolean).join(', ') || 'None — any food ID is acceptable';

  const errorSection = validationErrors?.length
    ? `\n⚠ PREVIOUS ATTEMPT FAILED — FIX THESE:\n${validationErrors.map((e) => `  • ${e}`).join('\n')}\n`
    : '';

  const prompt = `You are a clinical AI dietitian creating a 7-day Pakistani meal plan.
${errorSection}
CLINICAL TARGETS: ${JSON.stringify(clinicalAnalysis.dailyNutrientTargets)}
ACTIVE CONDITIONS: ${activeFlags}
DAILY BUDGET: PKR ${profile.dailyBudget} (breakfast:${budgets.breakfast} lunch:${budgets.lunch} dinner:${budgets.dinner} snack:${budgets.snack})

FOOD CATALOGUE (ID|Name|calories|price|allowedMealTypes|safetyFlags):
${catalogue}

STRICT RULES:
1. Each slot value must be a SINGLE integer ID from the catalogue above (e.g. 5).
2. Do NOT write food names. Do NOT combine IDs (never "5 and 12", never "5,12").
3. Pick an ID whose allowedMealTypes includes the slot (breakfast/lunch/dinner/snack).
4. For each active condition, ONLY use IDs that have that condition flag in safe:.
5. Keep each slot's food price within the budget for that slot.
6. Do not use the same ID more than twice across all 7 days.
7. Use null if no suitable ID exists for a slot.

Return ONLY a raw JSON array — no markdown, no backticks, no explanation:
[
  {"day":1,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null},
  {"day":2,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null},
  {"day":3,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null},
  {"day":4,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null},
  {"day":5,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null},
  {"day":6,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null},
  {"day":7,"breakfast":ID_or_null,"lunch":ID_or_null,"dinner":ID_or_null,"snack":ID_or_null}
]`;

  const model    = buildModel(0.1, 4096);
  const response = await model.invoke(prompt);

  let parsedIds;
  try {
    const raw      = extractJSON(response.content);
    const repaired = repairTruncatedJSON(raw);
    parsedIds = IdMealPlanSchema.parse(JSON.parse(repaired));
    console.log(`[LangGraph] ✔ GenerateMealPlan: received ${parsedIds.length} days of IDs`);
  } catch (err) {
    console.error('[LangGraph] ✘ ID parse failed:', err.message);
    console.error('[LangGraph] Raw (first 500 chars):', String(response.content).slice(0, 500));
    throw new Error(`Meal plan ID parse failed on attempt ${attempt}: ${err.message}`);
  }

  // Resolve IDs → exact food names immediately — validator works with names
  const draftPlanParsed = parsedIds.map((day) => ({
    day:       day.day,
    breakfast: day.breakfast ? (idToFood[day.breakfast]?.name ?? null) : null,
    lunch:     day.lunch     ? (idToFood[day.lunch]?.name     ?? null) : null,
    dinner:    day.dinner    ? (idToFood[day.dinner]?.name    ?? null) : null,
    snack:     day.snack     ? (idToFood[day.snack]?.name     ?? null) : null,
  }));

  console.log('[LangGraph] ✔ IDs resolved to exact food names');

  return {
    idToFood,            // stored in state for reference
    draftPlanParsed,
    generationAttempts: 1,
  };
};

// ─── NODE 4: ValidatePlan ─────────────────────────────────────────────────────

const validatePlanNode = async (state) => {
  console.log('[LangGraph] ▶ Node: ValidatePlan');

  const { profile, draftPlanParsed, availableFoods } = state;
  const errors = [];

  if (!draftPlanParsed || draftPlanParsed.length < 7) {
    errors.push(`Plan has ${draftPlanParsed?.length ?? 0} days — need exactly 7.`);
    return { validationErrors: errors };
  }

  const diseaseFlags = {
    isDiabetic:       'is_diabetic_safe',
    isHypertensive:   'is_hypertension_safe',
    isCardiac:        'is_cardiac_safe',
    hasKidneyDisease: 'is_kidney_safe',
    hasThyroid:       'is_thyroid_safe',
  };
  const activeDiseases = Object.keys(diseaseFlags).filter((k) => profile[k]);

  const foodMap = new Map();
  for (const f of availableFoods) {
    foodMap.set(f.name.toLowerCase().trim(), f);
  }

  for (const dayObj of draftPlanParsed) {
    const dayNum = dayObj.day;

    const slots = {
      breakfast: dayObj.breakfast,
      lunch:     dayObj.lunch,
      dinner:    dayObj.dinner,
      snack:     dayObj.snack,
    };

    const budgets = {
      breakfast: profile.dailyBudget * 0.25,
      lunch:     profile.dailyBudget * 0.35,
      dinner:    profile.dailyBudget * 0.30,
      snack:     profile.dailyBudget * 0.10,
    };

    let dayCost = 0;

    for (const [slotName, mealName] of Object.entries(slots)) {
      if (!mealName) continue;

      // Catch any combined-food strings that somehow slipped through
      if (/\s+and\s+|\s*,\s*|\s+with\s+/i.test(mealName)) {
        errors.push(`Day ${dayNum} ${slotName}: "${mealName}" has multiple foods — only ONE allowed.`);
        continue;
      }

      // Resolve: exact → fuzzy
      let food = foodMap.get(mealName.toLowerCase().trim());
      if (!food) {
        food = fuzzyFindFood(mealName, foodMap);
        if (food) {
          console.warn(`[LangGraph] Fuzzy match Day ${dayNum} ${slotName}: "${mealName}" → "${food.name}"`);
        } else {
          errors.push(`Day ${dayNum} ${slotName}: "${mealName}" not found in catalogue.`);
          continue;
        }
      }

      // Medical safety check
      for (const disease of activeDiseases) {
        if (!food[diseaseFlags[disease]]) {
          errors.push(`Day ${dayNum} ${slotName}: "${food.name}" is NOT safe for ${disease}.`);
        }
      }

      // Per-slot budget (15% tolerance)
      if (food.price > budgets[slotName] * 1.15) {
        errors.push(
          `Day ${dayNum} ${slotName}: "${food.name}" PKR ${food.price} exceeds slot limit ~PKR ${Math.round(budgets[slotName])}.`
        );
      }

      dayCost += food.price;
    }

    // Daily total budget (10% tolerance)
    if (dayCost > profile.dailyBudget * 1.10) {
      errors.push(
        `Day ${dayNum} total PKR ${Math.round(dayCost)} exceeds daily budget PKR ${profile.dailyBudget}.`
      );
    }
  }

  if (errors.length > 0) {
    console.warn(`[LangGraph] ✘ Validation failed (${errors.length} errors):`, errors);
    return { validationErrors: errors };
  }

  // Build final plan with fuzzy-corrected names where applicable
  const finalPlan = draftPlanParsed.map((dayObj) => {
    const resolve = (name) => {
      if (!name) return null;
      const exact = foodMap.get(name.toLowerCase().trim());
      if (exact) return exact.name;
      const fuzzy = fuzzyFindFood(name, foodMap);
      return fuzzy ? fuzzy.name : name;
    };
    return {
      day:       dayObj.day,
      breakfast: resolve(dayObj.breakfast),
      lunch:     resolve(dayObj.lunch),
      dinner:    resolve(dayObj.dinner),
      snack:     resolve(dayObj.snack),
    };
  });

  console.log('[LangGraph] ✔ Validation passed — plan is medically sound and within budget.');
  return { validationErrors: [], finalPlan };
};

module.exports = {
  analyzeHealthProfileNode,
  filterFoodsNode,
  generateMealPlanNode,
  validatePlanNode,
};
