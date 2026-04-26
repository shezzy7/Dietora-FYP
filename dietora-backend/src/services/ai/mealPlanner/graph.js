// src/services/ai/mealPlanner/graph.js
// DIETORA — LangGraph Workflow
//
// ──────────────────────────────────────────────────────────────────────────────
// Pipeline:
//
//   __start__
//      │
//      ▼
//   analyze_profile  ─────►  filter_foods  ─────►  bucket_by_meal_type
//                                                          │
//                                                          ▼
//                                                  feasibility_check
//                                                  (throws if any slot
//                                                   bucket is too small)
//                                                          │
//                                                          ▼
//                                                  generate_plan ◄──┐ retry
//                                                          │        │ (only
//                                                          ▼        │  for
//                                                  validate_plan ───┘  structural
//                                                          │           failures)
//                              ┌──────────────success──────┤
//                              │                           │ max_retries
//                              ▼                           ▼
//                             END                    greedy_fallback ──► END
//
// validate_plan auto-repairs single-slot issues in code, so the LLM is only
// retried on structural failures (parse errors, missing days). After 3 tries
// we fall back to a deterministic round-robin so the user always gets a plan.
// ──────────────────────────────────────────────────────────────────────────────

'use strict';

const { StateGraph, END } = require('@langchain/langgraph');
const { MealPlannerState } = require('./state');
const {
  analyzeHealthProfileNode,
  filterFoodsNode,
  bucketByMealTypeNode,
  feasibilityCheckNode,
  generateMealPlanNode,
  validatePlanNode,
  greedyFallbackNode,
} = require('./nodes');

const buildMealPlannerGraph = () => {
  const workflow = new StateGraph(MealPlannerState)
    .addNode('analyze_profile',     analyzeHealthProfileNode)
    .addNode('filter_foods',        filterFoodsNode)
    .addNode('bucket_by_meal_type', bucketByMealTypeNode)
    .addNode('feasibility_check',   feasibilityCheckNode)
    .addNode('generate_plan',       generateMealPlanNode)
    .addNode('validate_plan',       validatePlanNode)
    .addNode('greedy_fallback',     greedyFallbackNode)

    .addEdge('__start__',           'analyze_profile')
    .addEdge('analyze_profile',     'filter_foods')
    .addEdge('filter_foods',        'bucket_by_meal_type')
    .addEdge('bucket_by_meal_type', 'feasibility_check')
    .addEdge('feasibility_check',   'generate_plan')
    .addEdge('generate_plan',       'validate_plan')

    .addConditionalEdges(
      'validate_plan',
      (state) => {
        const hasErrors = state.validationErrors && state.validationErrors.length > 0;

        if (!hasErrors) {
          console.log('[LangGraph] ✔ Routing: success → END');
          return 'success';
        }

        if (state.generationAttempts >= 3) {
          console.warn(
            `[LangGraph] ⚠ Routing: max_retries hit after ${state.generationAttempts} attempts. ` +
            `Falling back to deterministic plan. Last errors: ${state.validationErrors.join(' | ')}`
          );
          return 'fallback';
        }

        console.warn(
          `[LangGraph] ↻ Routing: retry (attempt ${state.generationAttempts}/3). ` +
          `${state.validationErrors.length} error(s).`
        );
        return 'retry';
      },
      {
        success:  END,
        retry:    'generate_plan',
        fallback: 'greedy_fallback',
      }
    )

    .addEdge('greedy_fallback', END);

  return workflow.compile();
};

module.exports = { buildMealPlannerGraph };
