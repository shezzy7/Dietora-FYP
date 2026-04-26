// src/services/ai/mealPlanner/state.js
const { Annotation } = require("@langchain/langgraph");

const MealPlannerState = Annotation.Root({
  // ── Inputs ────────────────────────────────────────────
  profile:         Annotation(),
  checkInFeedback: Annotation(),
  availableFoods:  Annotation(),
  startDate:       Annotation(),

  // ── Intermediates ─────────────────────────────────────
  clinicalAnalysis: Annotation(),
  draftPlanRaw:     Annotation(),
  draftPlanParsed:  Annotation(),

  // ID→food map built in GenerateMealPlan, read in ValidatePlan
  idToFood: Annotation(),

  validationErrors: Annotation({
    reducer: (curr, update) => update, // always overwrite with latest
  }),
  generationAttempts: Annotation({
    reducer: (curr, update) => (curr ?? 0) + update,
    default: () => 0,
  }),

  // ── Output ────────────────────────────────────────────
  finalPlan: Annotation(),
});

module.exports = { MealPlannerState };
