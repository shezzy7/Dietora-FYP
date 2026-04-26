// src/services/ai/mealPlanner/nodes.js
// DIETORA — LangGraph Nodes (Groq: llama-3.3-70b-versatile)
//
// ──────────────────────────────────────────────────────────────────────────────
//  ARCHITECTURE (post-refactor):
//    1. analyze_profile      — LLM produces clinical targets
//    2. filter_foods         — HARD filter by disease + allergens (NEW)
//    3. bucket_by_meal_type  — split safe foods into per-slot pools (NEW)
//    4. feasibility_check    — fail fast if any slot pool is empty (NEW)
//    5. generate_plan        — LLM picks ONLY from per-slot safe pools
//    6. validate_plan        — slot-level repair, not full-plan retry (NEW)
//    7. greedy_fallback      — deterministic last resort (NEW)
//
//  Key principle: never let the LLM see an unsafe food. The LLM does not
//  filter — it only composes from a pre-vetted catalogue.
// ──────────────────────────────────────────────────────────────────────────────

'use strict';

const { ChatGroq } = require('@langchain/groq');
const { z } = require('zod');

// ─── Disease → safety-flag mapping (single source of truth) ──────────────────

const DISEASE_FLAG_MAP = {
  isDiabetic:       'is_diabetic_safe',
  isHypertensive:   'is_hypertension_safe',
  isCardiac:        'is_cardiac_safe',
  hasKidneyDisease: 'is_kidney_safe',
  hasThyroid:       'is_thyroid_safe',
  hasConstipation:  'is_constipation_safe',
  hasAnemia:        'is_anemia_safe',
};

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];
const MIN_OPTIONS_PER_SLOT = 2; // need at least 2 distinct items per slot to fill 7 days

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const ClinicalAnalysisSchema = z.object({
  conditionSeverity: z.record(z.string(), z.string()),
  dailyNutrientTargets: z.object({
    calories: z.number(),
    proteinGrams: z.number(),
    carbsGrams: z.number(),
    fatGrams: z.number(),
    sodiumMg: z.number(),
    fiberGrams: z.number(),
  }),
  dietaryPriorities: z.array(z.string()).max(5),
  foodsToEmphasise: z.array(z.string()).max(5),
  foodsToAvoid: z.array(z.string()).max(5),
  mealTimingAdvice: z.string(),
  clinicalRationale: z.string(),
});

const DayIdPlanSchema = z.object({
  day: z.number().int().min(1).max(7),
  breakfast: z.union([z.number().int().positive(), z.null()]),
  lunch: z.union([z.number().int().positive(), z.null()]),
  dinner: z.union([z.number().int().positive(), z.null()]),
  snack: z.union([z.number().int().positive(), z.null()]),
});

const IdMealPlanSchema = z.array(DayIdPlanSchema).length(7);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const extractJSON = (text) => {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Groq');
  }
  let cleaned = text
    .replace(/^```(?:json)?\s*/im, '')
    .replace(/\s*```\s*$/m, '')
    .trim();

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  const objectMatch = cleaned.match(/\{[\s\S]*\}/);

  if (cleaned.startsWith('[') && arrayMatch) return arrayMatch[0];
  if (objectMatch) return objectMatch[0];
  if (arrayMatch) return arrayMatch[0];

  throw new Error(`No JSON found in response. Raw (first 300 chars): ${cleaned.slice(0, 300)}`);
};

const repairTruncatedJSON = (text) => {
  try { JSON.parse(text); return text; } catch { /* repair below */ }
  const stack = [];
  let inString = false, escape = false;
  for (const ch of text) {
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
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
};

const buildModel = (temperature = 0.1, maxTokens = 4096) => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing from .env');
  return new ChatGroq({ model: 'llama-3.3-70b-versatile', apiKey, temperature, maxTokens });
};

/**
 * Returns true if the food is safe for EVERY active disease the user has.
 * If user has no active diseases, every food passes.
 */
const isFoodSafeForProfile = (food, activeDiseaseFlags) => {
  for (const flagName of activeDiseaseFlags) {
    if (!food[flagName]) return false;
  }
  return true;
};

const getActiveDiseaseFlags = (profile) =>
  Object.keys(DISEASE_FLAG_MAP)
    .filter((k) => profile[k])
    .map((k) => DISEASE_FLAG_MAP[k]);

const getActiveDiseaseNames = (profile) =>
  Object.keys(DISEASE_FLAG_MAP).filter((k) => profile[k]);

// ─── NODE 1: AnalyzeHealthProfile ─────────────────────────────────────────────

const analyzeHealthProfileNode = async (state) => {
  console.log('[LangGraph] ▶ Node: AnalyzeHealthProfile');

  const { profile, checkInFeedback } = state;
  const model = buildModel(0.1, 1024);

  const diseases = getActiveDiseaseNames(profile)
    .map((d) => d.replace(/^(is|has)/, '').replace(/([A-Z])/g, ' $1').trim())
    .join(', ') || 'None';

  const allergies = profile.allergies?.length ? profile.allergies.join(', ') : 'None';
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

  const response = await model.invoke(prompt);
  const raw = extractJSON(response.content);
  const repaired = repairTruncatedJSON(raw);
  const validated = ClinicalAnalysisSchema.parse(JSON.parse(repaired));

  console.log('[LangGraph] ✔ ClinicalAnalysis complete:', JSON.stringify(validated.dailyNutrientTargets));
  return { clinicalAnalysis: validated };
};

// ─── NODE 2: FilterFoods (HARD disease + allergen filter) ────────────────────
//
// THIS IS THE CRITICAL FIX. We no longer hand the LLM a 130-item catalogue
// and hope it picks safe items. We strip every unsafe food up-front, so the
// LLM physically cannot select an unsafe one.

const filterFoodsNode = async (state) => {
  console.log('[LangGraph] ▶ Node: FilterFoods (disease + allergens)');

  const { profile, availableFoods } = state;
  const allergyLower = (profile.allergies || []).map((a) => a.toLowerCase().trim());
  const activeFlags = getActiveDiseaseFlags(profile);
  const activeDiseaseNames = getActiveDiseaseNames(profile);

  let stage1Allergen = 0;
  let stage2Disease = 0;

  const safeFoods = availableFoods.filter((f) => {
    // Stage 1: allergens
    const hasAllergen = f.allergens?.some((a) => allergyLower.includes(a.toLowerCase()));
    if (hasAllergen) { stage1Allergen += 1; return false; }

    // Stage 2: disease safety — must be safe for ALL active conditions
    if (!isFoodSafeForProfile(f, activeFlags)) { stage2Disease += 1; return false; }

    return true;
  });

  console.log(
    `[LangGraph] ✔ FilterFoods: ${availableFoods.length} → ${safeFoods.length} ` +
    `(removed: ${stage1Allergen} allergen, ${stage2Disease} disease-unsafe). ` +
    `Active conditions: ${activeDiseaseNames.length ? activeDiseaseNames.join(', ') : 'none'}`
  );

  return { availableFoods: safeFoods };
};

// ─── NODE 3: BucketByMealType ─────────────────────────────────────────────────
//
// Split the safe pool into per-slot buckets so the LLM only ever sees foods
// that are actually allowed in the slot it's filling. A "breakfast" slot
// never sees biryani. A "snack" slot never sees mutton karahi.

const bucketByMealTypeNode = async (state) => {
  console.log('[LangGraph] ▶ Node: BucketByMealType');

  const { availableFoods } = state;
  const mealBuckets = { breakfast: [], lunch: [], dinner: [], snack: [] };

  for (const food of availableFoods) {
    const types = food.mealType || [];
    for (const slot of MEAL_SLOTS) {
      if (types.includes(slot)) mealBuckets[slot].push(food);
    }
  }

  console.log(
    `[LangGraph] ✔ MealBuckets: ` +
    `breakfast=${mealBuckets.breakfast.length}, ` +
    `lunch=${mealBuckets.lunch.length}, ` +
    `dinner=${mealBuckets.dinner.length}, ` +
    `snack=${mealBuckets.snack.length}`
  );

  return { mealBuckets };
};

// ─── NODE 4: FeasibilityCheck ─────────────────────────────────────────────────
//
// Before we waste 3 LLM retries on an impossible task, verify each slot has
// enough options. If it doesn't, fail fast with an actionable message.

const feasibilityCheckNode = async (state) => {
  console.log('[LangGraph] ▶ Node: FeasibilityCheck');

  const { mealBuckets, profile } = state;
  const issues = [];
  const activeDiseaseNames = getActiveDiseaseNames(profile);

  for (const slot of MEAL_SLOTS) {
    const count = mealBuckets[slot]?.length || 0;
    if (count < MIN_OPTIONS_PER_SLOT) {
      issues.push(
        `Slot "${slot}" has only ${count} safe food(s). At least ${MIN_OPTIONS_PER_SLOT} required ` +
        `to build a varied 7-day plan for the user's profile.`
      );
    }
  }

  if (issues.length > 0) {
    const condStr = activeDiseaseNames.length ? activeDiseaseNames.join(', ') : 'none';
    const msg =
      `Cannot build a meal plan for this user. Active conditions: ${condStr}. ` +
      `Issues: ${issues.join(' | ')} ` +
      `Please add more safe foods to the catalogue or relax dietary constraints.`;
    console.error(`[LangGraph] ✘ Feasibility failed: ${msg}`);
    throw new Error(msg);
  }

  console.log('[LangGraph] ✔ Feasibility passed — all slots have sufficient options');
  return {};
};

// ─── NODE 5: GenerateMealPlan ─────────────────────────────────────────────────
//
// LLM picks IDs from per-slot pools only. The catalogue it sees is divided
// into four sections — one per slot — so it cannot pick a non-breakfast item
// for breakfast, or an unsafe item for any slot.

const generateMealPlanNode = async (state) => {
  const attempt = state.generationAttempts + 1;
  console.log(`[LangGraph] ▶ Node: GenerateMealPlan (Attempt ${attempt}/3)`);

  const { profile, clinicalAnalysis, mealBuckets, validationErrors } = state;

  // Build a single global ID space — but format the catalogue per-slot.
  const idToFood = {};
  const slotCatalogues = {};
  let nextId = 1;

  // Track which ID was assigned to each food (so the same food gets one ID even
  // if it qualifies for multiple slots).
  const foodToId = new Map();
  const ensureId = (food) => {
    const key = food._id?.toString() || food.name;
    if (foodToId.has(key)) return foodToId.get(key);
    const id = nextId++;
    foodToId.set(key, id);
    idToFood[id] = food;
    return id;
  };

  for (const slot of MEAL_SLOTS) {
    const lines = mealBuckets[slot].map((f) => {
      const id = ensureId(f);
      return `${id}|"${f.name}"|${f.calories}cal|PKR${Math.round(f.price)}`;
    });
    slotCatalogues[slot] = lines.join('\n');
  }

  const budgets = {
    breakfast: Math.round(profile.dailyBudget * 0.25),
    lunch:     Math.round(profile.dailyBudget * 0.35),
    dinner:    Math.round(profile.dailyBudget * 0.35),
    snack:     Math.round(profile.dailyBudget * 0.15),
  };

  const errorSection = validationErrors?.length
    ? `\n⚠ PREVIOUS ATTEMPT FAILED — FIX THESE:\n${validationErrors.map((e) => `  • ${e}`).join('\n')}\n`
    : '';

  const activeDiseaseNames = getActiveDiseaseNames(profile);
  const conditionContext = activeDiseaseNames.length
    ? `Patient has: ${activeDiseaseNames.join(', ')}. The catalogues below already exclude all unsafe foods — every option is medically safe to pick.`
    : `Patient has no active medical conditions. Pick freely from the catalogues.`;

  const prompt = `You are a clinical AI dietitian creating a 7-day Pakistani meal plan.
${errorSection}
${conditionContext}

CLINICAL TARGETS: ${JSON.stringify(clinicalAnalysis.dailyNutrientTargets)}
DAILY BUDGET: PKR ${profile.dailyBudget} (breakfast:${budgets.breakfast} lunch:${budgets.lunch} dinner:${budgets.dinner} snack:${budgets.snack})

═══ BREAKFAST CATALOGUE (ID|Name|cal|PKR) ═══
${slotCatalogues.breakfast}

═══ LUNCH CATALOGUE (ID|Name|cal|PKR) ═══
${slotCatalogues.lunch}

═══ DINNER CATALOGUE (ID|Name|cal|PKR) ═══
${slotCatalogues.dinner}

═══ SNACK CATALOGUE (ID|Name|cal|PKR) ═══
${slotCatalogues.snack}

STRICT RULES:
1. Each slot value must be a SINGLE integer ID from the matching catalogue above (e.g. 5).
2. Do NOT write food names. Do NOT combine IDs (never "5 and 12", never "5,12").
3. Breakfast IDs MUST come from the BREAKFAST CATALOGUE — likewise for lunch, dinner, snack.
4. Try to keep each slot's price within the slot budget; minor overshoots are fine.
5. Prefer variety — avoid using the same ID more than 2-3 times in 7 days.
6. Use null only if absolutely no suitable ID exists (rare — the catalogues are pre-filtered).

Return ONLY a raw JSON array — no markdown, no backticks, no explanation:
[
  {"day":1,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID},
  {"day":2,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID},
  {"day":3,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID},
  {"day":4,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID},
  {"day":5,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID},
  {"day":6,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID},
  {"day":7,"breakfast":ID,"lunch":ID,"dinner":ID,"snack":ID}
]`;

  const model = buildModel(0.2, 4096);
  const response = await model.invoke(prompt);

  let parsedIds;
  try {
    const raw = extractJSON(response.content);
    const repaired = repairTruncatedJSON(raw);
    parsedIds = IdMealPlanSchema.parse(JSON.parse(repaired));
    console.log(`[LangGraph] ✔ GenerateMealPlan: received ${parsedIds.length} days of IDs`);
  } catch (err) {
    console.error('[LangGraph] ✘ ID parse failed:', err.message);
    console.error('[LangGraph] Raw (first 500 chars):', String(response.content).slice(0, 500));
    // Don't throw — let validate_plan handle as a structural error so the
    // greedy fallback can rescue it.
    return {
      idToFood,
      draftPlanParsed: [],
      generationAttempts: 1,
      validationErrors: [`Meal plan ID parse failed on attempt ${attempt}: ${err.message}`],
    };
  }

  // Resolve IDs → food objects (we keep both name and _id reference for validate)
  const draftPlanParsed = parsedIds.map((day) => ({
    day: day.day,
    breakfast: day.breakfast ? idToFood[day.breakfast] || null : null,
    lunch:     day.lunch     ? idToFood[day.lunch]     || null : null,
    dinner:    day.dinner    ? idToFood[day.dinner]    || null : null,
    snack:     day.snack     ? idToFood[day.snack]     || null : null,
  }));

  console.log('[LangGraph] ✔ IDs resolved to food objects');

  return {
    idToFood,
    draftPlanParsed,
    generationAttempts: 1,
  };
};

// ─── NODE 6: ValidatePlan + AutoRepair ────────────────────────────────────────
//
// Old behavior: any error → throw away the whole plan, retry from scratch.
// New behavior: try to repair single-slot issues in code (cheap), only retry
// the LLM if the plan is structurally broken (missing days, parse failed).

const validatePlanNode = async (state) => {
  console.log('[LangGraph] ▶ Node: ValidatePlan');

  const { profile, draftPlanParsed, mealBuckets } = state;
  const errors = [];

  // Structural check — a missing/short plan is unrecoverable in code, must retry
  if (!draftPlanParsed || draftPlanParsed.length < 7) {
    errors.push(`Plan has ${draftPlanParsed?.length ?? 0} days — need exactly 7.`);
    return { validationErrors: errors };
  }

  const activeFlags = getActiveDiseaseFlags(profile);

  // Track usage for variety repair
  const usageCount = new Map();
  const bumpUsage = (food) => {
    if (!food) return;
    const key = food._id?.toString() || food.name;
    usageCount.set(key, (usageCount.get(key) || 0) + 1);
  };

  // Repair function — pick the cheapest safe food from the bucket that the
  // user hasn't seen too often, that is different from the one we're replacing.
  const repairSlot = (slot, badFood, dayIndex) => {
    const bucket = mealBuckets[slot] || [];
    const badKey = badFood?._id?.toString() || badFood?.name;

    // Sort bucket: lowest usage first, then by closest match to slot budget
    const slotBudget = profile.dailyBudget *
      (slot === 'breakfast' ? 0.25 : slot === 'snack' ? 0.15 : 0.35);

    const ranked = bucket
      .filter((f) => isFoodSafeForProfile(f, activeFlags))
      .filter((f) => {
        const k = f._id?.toString() || f.name;
        return k !== badKey;
      })
      .map((f) => {
        const k = f._id?.toString() || f.name;
        const usage = usageCount.get(k) || 0;
        const budgetDelta = Math.abs(f.price - slotBudget);
        return { food: f, usage, budgetDelta };
      })
      .sort((a, b) => {
        if (a.usage !== b.usage) return a.usage - b.usage;
        return a.budgetDelta - b.budgetDelta;
      });

    if (ranked.length === 0) return null;
    // Add a tiny bit of rotation per day so we don't always pick #1
    const idx = dayIndex % Math.min(3, ranked.length);
    return ranked[idx].food;
  };

  let repairCount = 0;
  const repairedPlan = draftPlanParsed.map((dayObj, dayIdx) => {
    const out = { day: dayObj.day };

    for (const slot of MEAL_SLOTS) {
      let food = dayObj[slot];

      // Case A: slot is null/missing
      if (!food) {
        food = repairSlot(slot, null, dayIdx);
        if (food) {
          repairCount += 1;
          console.log(`[LangGraph] 🔧 Repaired Day ${dayObj.day} ${slot}: was null → "${food.name}"`);
        }
        out[slot] = food;
        bumpUsage(food);
        continue;
      }

      // Case B: food is unsafe for active diseases
      const safe = isFoodSafeForProfile(food, activeFlags);
      // Case C: food is in the wrong slot bucket (e.g. LLM picked dinner item for breakfast)
      const inBucket = (mealBuckets[slot] || []).some((f) => {
        const k = f._id?.toString() || f.name;
        return k === (food._id?.toString() || food.name);
      });

      if (!safe || !inBucket) {
        const reason = !safe ? 'unsafe for active conditions' : `not allowed in ${slot} slot`;
        const replacement = repairSlot(slot, food, dayIdx);
        if (replacement) {
          repairCount += 1;
          console.log(`[LangGraph] 🔧 Repaired Day ${dayObj.day} ${slot}: "${food.name}" (${reason}) → "${replacement.name}"`);
          out[slot] = replacement;
          bumpUsage(replacement);
        } else {
          // Truly no replacement available — this shouldn't happen because
          // feasibility_check already verified each bucket has options.
          errors.push(`Day ${dayObj.day} ${slot}: "${food.name}" ${reason}, and no replacement available.`);
          out[slot] = null;
        }
        continue;
      }

      // Case D: all good
      out[slot] = food;
      bumpUsage(food);
    }

    return out;
  });

  // If repair left any unrecoverable errors, signal a retry
  if (errors.length > 0) {
    console.warn(`[LangGraph] ✘ Validation failed (${errors.length} unrecoverable errors):`, errors);
    return { validationErrors: errors };
  }

  if (repairCount > 0) {
    console.log(`[LangGraph] ✔ Validation passed after auto-repairing ${repairCount} slot(s)`);
  } else {
    console.log('[LangGraph] ✔ Validation passed cleanly — no repairs needed');
  }

  // Build finalPlan in the legacy shape the assembler expects:
  //   { day, breakfast: <name|null>, lunch: <name|null>, ... }
  const finalPlan = repairedPlan.map((d) => ({
    day: d.day,
    breakfast: d.breakfast?.name || null,
    lunch:     d.lunch?.name     || null,
    dinner:    d.dinner?.name    || null,
    snack:     d.snack?.name     || null,
  }));

  return { validationErrors: [], finalPlan };
};

// ─── NODE 7: GreedyFallback ───────────────────────────────────────────────────
//
// Last resort. If the LLM fails 3 times (parse errors, API timeouts, whatever),
// we build a deterministic plan by round-robining through the safe per-slot
// pools, weighted by price. This guarantees a valid plan for any feasible
// input — the user always gets *something*, never a hard failure.

const greedyFallbackNode = async (state) => {
  console.log('[LangGraph] ▶ Node: GreedyFallback (LLM exhausted retries)');

  const { profile, mealBuckets } = state;
  const activeFlags = getActiveDiseaseFlags(profile);

  const slotBudgets = {
    breakfast: profile.dailyBudget * 0.25,
    lunch:     profile.dailyBudget * 0.35,
    dinner:    profile.dailyBudget * 0.35,
    snack:     profile.dailyBudget * 0.15,
  };

  // Pre-rank each bucket: safe foods sorted by price-fit to slot budget
  const ranked = {};
  for (const slot of MEAL_SLOTS) {
    ranked[slot] = (mealBuckets[slot] || [])
      .filter((f) => isFoodSafeForProfile(f, activeFlags))
      .sort((a, b) => Math.abs(a.price - slotBudgets[slot]) - Math.abs(b.price - slotBudgets[slot]));
  }

  // Round-robin pick: day i → ranked[slot][i % len]
  const finalPlan = [];
  for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
    const dayObj = { day: dayIdx + 1 };
    for (const slot of MEAL_SLOTS) {
      const pool = ranked[slot];
      if (pool.length === 0) {
        dayObj[slot] = null;
      } else {
        // Use a small offset per slot so breakfast/lunch/dinner don't all rotate identically
        const offset = MEAL_SLOTS.indexOf(slot);
        const food = pool[(dayIdx + offset) % pool.length];
        dayObj[slot] = food.name;
      }
    }
    finalPlan.push(dayObj);
  }

  console.log('[LangGraph] ✔ GreedyFallback produced a deterministic 7-day plan');
  return {
    finalPlan,
    validationErrors: [],
    usedFallback: true,
  };
};

module.exports = {
  analyzeHealthProfileNode,
  filterFoodsNode,
  bucketByMealTypeNode,
  feasibilityCheckNode,
  generateMealPlanNode,
  validatePlanNode,
  greedyFallbackNode,
};
