// src/services/ai/mealPlanner/graph.js
const { StateGraph, END } = require("@langchain/langgraph");
const { MealPlannerState } = require("./state");
const { 
  analyzeHealthProfileNode, 
  filterFoodsNode, 
  generateMealPlanNode, 
  validatePlanNode 
} = require("./nodes");

// Build the LangGraph workflow
const buildMealPlannerGraph = () => {
  const workflow = new StateGraph(MealPlannerState)
    .addNode("analyze_profile", analyzeHealthProfileNode)
    .addNode("filter_foods", filterFoodsNode)
    .addNode("generate_plan", generateMealPlanNode)
    .addNode("validate_plan", validatePlanNode)
    
    // Set Entry Point
    .addEdge("__start__", "analyze_profile")
    
    // Analyze -> Filter -> Generate -> Validate
    .addEdge("analyze_profile", "filter_foods")
    .addEdge("filter_foods", "generate_plan")
    .addEdge("generate_plan", "validate_plan")
    
    // Conditional edge from Validate
    .addConditionalEdges(
      "validate_plan",
      (state) => {
        // If no errors, we are done
        if (!state.validationErrors || state.validationErrors.length === 0) {
          return "success";
        }
        // If errors exist but we exceeded retry limit (e.g., 3), exit to prevent infinite loop
        if (state.generationAttempts >= 3) {
          console.warn("[LangGraph] Max retries reached. Forcing exit with current (possibly flawed) plan.");
          return "max_retries";
        }
        // Otherwise, loop back to generation to fix errors
        return "retry";
      },
      {
        success: END,
        max_retries: END,
        retry: "generate_plan"
      }
    );

  return workflow.compile();
};

module.exports = { buildMealPlannerGraph };
