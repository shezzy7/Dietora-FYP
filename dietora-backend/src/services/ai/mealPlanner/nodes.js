// src/services/ai/mealPlanner/nodes.js
const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("@langchain/core/output_parsers");
const { z } = require("zod");

// 1. Initialize Gemini Model — use latest gemini-2.5-flash for speed & structure
const getGeminiModel = (temperature = 0.2) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing from .env');

  return new ChatGoogleGenerativeAI({
    modelName: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    apiKey,
    temperature,
    maxOutputTokens: 2048,
  });
};

// ─── NODE: AnalyzeHealthProfile ──────────────────────────────
const analyzeHealthProfileNode = async (state) => {
  console.log("[LangGraph] Node: AnalyzeHealthProfile");
  const { profile, checkInFeedback } = state;
  const model = getGeminiModel();

  // Define structured output
  const clinicalParser = StructuredOutputParser.fromZodSchema(
    z.object({
      conditionSeverity: z.record(z.string(), z.string()),
      dailyNutrientTargets: z.object({
        calories: z.number(),
        proteinGrams: z.number(),
        carbsGrams: z.number(),
        fatGrams: z.number(),
        sodiumMg: z.number(),
        fiberGrams: z.number()
      }),
      dietaryPriorities: z.array(z.string()),
      foodsToEmphasise: z.array(z.string()),
      foodsToAvoid: z.array(z.string()),
      mealTimingAdvice: z.string(),
      clinicalRationale: z.string()
    })
  );

  const prompt = PromptTemplate.fromTemplate(`
    You are a board-certified clinical dietitian.
    Analyse the following patient profile and output a structured clinical dietary assessment.
    
    === PATIENT PROFILE ===
    Age: {age} | Gender: {gender} | Weight: {weight}kg | Height: {height}cm
    BMI: {bmi} | Goal: {goal}
    Calorie Target: {calories} kcal/day
    Diseases: {diseases}
    Allergies: {allergies}
    Feedback from last week: {feedback}
    
    {format_instructions}
  `);

  const diseases = [
    profile.isDiabetic && 'Diabetes',
    profile.isHypertensive && 'Hypertension',
    profile.isCardiac && 'Cardiac',
    profile.hasKidneyDisease && 'Kidney Disease',
    profile.hasThyroid && 'Thyroid'
  ].filter(Boolean).join(', ') || 'None';

  const formattedPrompt = await prompt.format({
    age: profile.age,
    gender: profile.gender,
    weight: profile.weight,
    height: profile.height,
    bmi: profile.bmi,
    goal: profile.goal,
    calories: profile.dailyCalorieTarget,
    diseases,
    allergies: profile.allergies?.length ? profile.allergies.join(', ') : 'None',
    feedback: checkInFeedback ? JSON.stringify(checkInFeedback) : 'None',
    format_instructions: clinicalParser.getFormatInstructions(),
  });

  const response = await model.invoke(formattedPrompt);
  const clinicalAnalysis = await clinicalParser.parse(response.content);

  return { clinicalAnalysis };
};

// ─── NODE: FilterFoods ───────────────────────────────────────
const filterFoodsNode = async (state) => {
  console.log("[LangGraph] Node: FilterFoods");
  const { profile, availableFoods } = state;
  
  const allergyLower = (profile.allergies || []).map(a => a.toLowerCase());
  
  // Filter out allergies entirely before giving to AI
  const safeFoods = availableFoods.filter(
    (f) => !f.allergens?.some((a) => allergyLower.includes(a.toLowerCase()))
  );

  return { availableFoods: safeFoods }; // Updates state with filtered list
};

// ─── NODE: GenerateMealPlan ──────────────────────────────────
const generateMealPlanNode = async (state) => {
  console.log(`[LangGraph] Node: GenerateMealPlan (Attempt ${state.generationAttempts + 1})`);
  const { profile, clinicalAnalysis, availableFoods, startDate, validationErrors } = state;
  const model = getGeminiModel();

  // Create a minimal catalogue string to save tokens
  const catalogue = availableFoods.map(f => {
    const safe = [
      f.is_diabetic_safe && 'diabetic',
      f.is_hypertension_safe && 'bp',
      f.is_cardiac_safe && 'cardiac',
      f.is_kidney_safe && 'kidney',
      f.is_thyroid_safe && 'thyroid'
    ].filter(Boolean).join(',') || 'general';
    return `${f.name}|cal:${f.calories}|price:PKR${f.price}|meal:${(f.mealType||[]).join(',')}|safe:${safe}`;
  }).join('\n');

  const budgetBreakdown = {
    bf: Math.round(profile.dailyBudget * 0.25),
    lu: Math.round(profile.dailyBudget * 0.35),
    di: Math.round(profile.dailyBudget * 0.30),
    sn: Math.round(profile.dailyBudget * 0.10),
  };

  const planParser = StructuredOutputParser.fromZodSchema(
    z.array(z.object({
      day: z.number(),
      breakfast: z.string().nullable(),
      lunch: z.string().nullable(),
      dinner: z.string().nullable(),
      snack: z.string().nullable()
    }))
  );

  let errorContext = "";
  if (validationErrors && validationErrors.length > 0) {
    errorContext = `\n\n=== PREVIOUS ATTEMPT ERRORS (FIX THESE) ===\n${validationErrors.join('\n')}`;
  }

  const prompt = PromptTemplate.fromTemplate(`
    You are a clinical AI generating a 7-day meal plan.
    
    === CLINICAL RULES ===
    {clinical_analysis}
    
    === USER CONSTRAINTS ===
    Daily Budget: PKR {budget}
    Budget per meal: BF: {bf}, LU: {lu}, DI: {di}, SN: {sn}
    {error_context}

    === AVAILABLE FOODS ===
    Format: Name|cal|price|mealType|safety
    {catalogue}
    
    CRITICAL RULES:
    1. ONLY use EXACT food names from the catalogue.
    2. If the user has a disease, you MUST pick foods with the corresponding safety flag (e.g. 'diabetic').
    3. Respect the budget per meal slot.
    
    {format_instructions}
  `);

  const formattedPrompt = await prompt.format({
    clinical_analysis: JSON.stringify(clinicalAnalysis),
    budget: profile.dailyBudget,
    bf: budgetBreakdown.bf,
    lu: budgetBreakdown.lu,
    di: budgetBreakdown.di,
    sn: budgetBreakdown.sn,
    catalogue,
    error_context: errorContext,
    format_instructions: planParser.getFormatInstructions()
  });

  const response = await model.invoke(formattedPrompt);
  
  let parsed;
  try {
    parsed = await planParser.parse(response.content);
  } catch (err) {
    console.error("[LangGraph] Failed to parse meal plan output.");
    parsed = []; // Will be caught by validator
  }

  return { 
    draftPlanParsed: parsed,
    generationAttempts: (state.generationAttempts || 0) + 1  // BUG FIX: properly increment
  };
};

// ─── NODE: ValidatePlan ──────────────────────────────────────
const validatePlanNode = async (state) => {
  console.log("[LangGraph] Node: ValidatePlan");
  const { profile, draftPlanParsed, availableFoods } = state;
  
  const errors = [];
  
  if (!draftPlanParsed || draftPlanParsed.length < 7) {
    errors.push("Plan did not contain 7 days. Generate exactly 7 days.");
  } else {
    // Check diseases and budgets
    let totalWeekCost = 0;
    const diseaseFlags = {
      isDiabetic: 'is_diabetic_safe',
      isHypertensive: 'is_hypertension_safe',
      isCardiac: 'is_cardiac_safe',
      hasKidneyDisease: 'is_kidney_safe',
      hasThyroid: 'is_thyroid_safe'
    };

    const activeDiseases = Object.keys(diseaseFlags).filter(k => profile[k]);

    for (const day of draftPlanParsed) {
      const meals = [day.breakfast, day.lunch, day.dinner, day.snack].filter(Boolean);
      let dayCost = 0;
      
      for (const mealName of meals) {
        const food = availableFoods.find(f => f.name.toLowerCase() === mealName.toLowerCase());
        if (!food) {
          errors.push(`Food "${mealName}" on Day ${day.day} is not in the catalogue.`);
          continue;
        }
        
        dayCost += food.price;

        // Check medical safety
        for (const disease of activeDiseases) {
          const dbFlag = diseaseFlags[disease];
          if (!food[dbFlag]) {
            errors.push(`Medical Violation: "${food.name}" is NOT safe for ${disease}. Replace it.`);
          }
        }
      }
      
      totalWeekCost += dayCost;
      if (dayCost > profile.dailyBudget) {
        errors.push(`Budget Violation: Day ${day.day} cost (PKR ${dayCost}) exceeds daily budget of ${profile.dailyBudget}.`);
      }
    }
  }

  if (errors.length > 0) {
    console.log(`[LangGraph] Validation failed with ${errors.length} errors.`);
    return { validationErrors: errors };
  }

  console.log("[LangGraph] Validation passed! Plan is medically sound and within budget.");
  return { 
    validationErrors: [],
    finalPlan: draftPlanParsed
  };
};

module.exports = {
  analyzeHealthProfileNode,
  filterFoodsNode,
  generateMealPlanNode,
  validatePlanNode
};
