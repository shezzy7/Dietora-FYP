// src/services/ai/chatbot/tools.js
const { DynamicStructuredTool } = require("@langchain/core/tools");
const { z } = require("zod");
const HealthProfile = require('../../../models/HealthProfile');
const MealPlan = require('../../../models/MealPlan');
const { searchStoresForFood } = require('../../places.service');

const createChatbotTools = (userId, locationContext) => {
  const fetchUserProfileTool = new DynamicStructuredTool({
    name: "fetch_user_profile",
    description: "Fetches the current user's health profile, including diseases, allergies, and budget. Call this first if you need medical context.",
    schema: z.object({}),
    func: async () => {
      try {
        const profile = await HealthProfile.findOne({ user: userId }).lean();
        if (!profile) return "User has not set up a health profile.";
        
        return JSON.stringify({
          demographics: `${profile.age}yo ${profile.gender}, ${profile.height}cm, ${profile.weight}kg`,
          healthMetrics: `BMI: ${profile.bmi}, BMR: ${profile.bmr}, TDEE: ${profile.tdee}`,
          medicalConditions: {
            isDiabetic: profile.isDiabetic,
            isHypertensive: profile.isHypertensive,
            isCardiac: profile.isCardiac,
            hasKidneyDisease: profile.hasKidneyDisease,
            hasThyroid: profile.hasThyroid,
            description: profile.diseaseDescription || "None",
          },
          allergies: profile.allergies?.length ? profile.allergies : ["None"],
          budget: `PKR ${profile.dailyBudget}/day`,
          goal: profile.goal
        });
      } catch (err) {
        return `Error fetching profile: ${err.message}`;
      }
    },
  });

  const fetchActiveMealPlanTool = new DynamicStructuredTool({
    name: "fetch_active_meal_plan",
    description: "Fetches the user's currently active meal plan to see what they are supposed to eat this week.",
    schema: z.object({}),
    func: async () => {
      try {
        const plan = await MealPlan.findOne({ user: userId, status: 'active' }).lean();
        if (!plan) return "User has no active meal plan. Advise them to generate one.";
        
        return JSON.stringify({
          title: plan.title,
          startDate: plan.startDate,
          weeklyCost: plan.weeklyTotalCost,
          planConfig: plan.planConfig,
          message: "Full 7-day details are too large, but they have an active plan."
        });
      } catch (err) {
        return `Error fetching meal plan: ${err.message}`;
      }
    },
  });

  const searchLocalStoresTool = new DynamicStructuredTool({
    name: "search_local_stores",
    description: "Searches for real, physical grocery stores nearby to buy specific food. Call this when the user asks where to buy something.",
    schema: z.object({
      foodName: z.string().describe("The specific food item the user wants to buy (e.g., 'milk', 'chicken', 'basmati rice')")
    }),
    func: async ({ foodName }) => {
      if (!locationContext?.currentLocation?.coordinates) {
        return "I cannot search for stores because the user has not provided their GPS location.";
      }
      
      const [longitude, latitude] = locationContext.currentLocation.coordinates;
      
      try {
        const stores = await searchStoresForFood(
          'grocery', 
          foodName, 
          latitude, 
          longitude, 
          5000 // 5km radius
        );
        
        if (!stores || stores.length === 0) {
          return `No nearby stores found for ${foodName}.`;
        }
        
        // Return top 3 stores to save tokens
        const topStores = stores.slice(0, 3).map(s => ({
          name: s.name,
          address: s.address,
          distance: s.distanceText || 'Unknown',
          status: s.isOpenNow ? 'Open' : 'Closed/Unknown'
        }));
        
        return JSON.stringify({ storesFound: topStores, foodSearched: foodName });
      } catch (err) {
        return `Error searching for stores: ${err.message}`;
      }
    },
  });

  return [fetchUserProfileTool, fetchActiveMealPlanTool, searchLocalStoresTool];
};

module.exports = { createChatbotTools };
