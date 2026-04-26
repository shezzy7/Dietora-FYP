// src/services/ai/mealPlanner/graph.js
// DIETORA — LangGraph Workflow

'use strict';

const { StateGraph, END } = require('@langchain/langgraph');
const { MealPlannerState } = require('./state');
const {
  analyzeHealthProfileNode,
  filterFoodsNode,
  generateMealPlanNode,
  validatePlanNode,
} = require('./nodes');

const buildMealPlannerGraph = () => {
  const workflow = new StateGraph(MealPlannerState)
    .addNode('analyze_profile', analyzeHealthProfileNode)
    .addNode('filter_foods',    filterFoodsNode)
    .addNode('generate_plan',   generateMealPlanNode)
    .addNode('validate_plan',   validatePlanNode)

    .addEdge('__start__',       'analyze_profile')
    .addEdge('analyze_profile', 'filter_foods')
    .addEdge('filter_foods',    'generate_plan')
    .addEdge('generate_plan',   'validate_plan')

    .addConditionalEdges(
      'validate_plan',
      (state) => {
        const hasErrors = state.validationErrors && state.validationErrors.length > 0;

        if (!hasErrors) {
          console.log('[LangGraph] ✔ Routing: success → END');
          return 'success';
        }

        if (state.generationAttempts >= 3) {
          console.error(
            `[LangGraph] ✘ Routing: max_retries hit after ${state.generationAttempts} attempts. ` +
            `Unresolved errors: ${state.validationErrors.join(' | ')}`
          );
          return 'max_retries';
        }

        console.warn(
          `[LangGraph] ↻ Routing: retry (attempt ${state.generationAttempts}/3). ` +
          `${state.validationErrors.length} validation error(s).`
        );
        return 'retry';
      },
      {
        success:     END,
        max_retries: 'fail_node',
        retry:       'generate_plan',
      }
    )

    .addNode('fail_node', async (state) => {
      const errorSummary = (state.validationErrors || []).join('; ');
      throw new Error(
        `[MealPlanner] AI failed to produce a valid plan after 3 attempts. ` +
        `Last validation errors: ${errorSummary}`
      );
    });

  return workflow.compile();
};

module.exports = { buildMealPlannerGraph };
