import { createSlice } from '@reduxjs/toolkit'

// Rule-based chatbot responses
const ruleResponses = {
  calories: "Calories are units of energy in food. Daily needs vary: generally 1800-2200 kcal for women and 2200-2800 kcal for men, depending on activity level.",
  diabetes: "For diabetes management, focus on low-glycemic foods like dal, vegetables, whole wheat roti, and avoid sugary drinks and white rice in large portions.",
  hypertension: "For hypertension, reduce sodium intake, avoid pickles and processed foods. Eat more potassium-rich foods like bananas, spinach (palak), and tomatoes.",
  cardiac: "For heart health, choose foods low in saturated fats. Prefer grilled or boiled chicken over fried. Include fish, nuts, and olive oil.",
  protein: "Good Pakistani protein sources: chicken, dal (lentils), eggs, paneer, and fish. Aim for 0.8g per kg of body weight daily.",
  budget: "To eat healthy on a budget in Faisalabad: buy seasonal vegetables, use dal as protein, cook in bulk, and avoid packaged foods.",
  bmi: "BMI (Body Mass Index) is calculated as weight(kg) / height(m)². Below 18.5 is underweight, 18.5-24.9 is normal, 25-29.9 is overweight, 30+ is obese.",
  bmr: "BMR (Basal Metabolic Rate) is the calories your body needs at rest. It's calculated using the Mifflin-St Jeor formula based on weight, height, age, and gender.",
  roti: "One wheat roti (medium, ~30g) has about 71 calories, 3g protein, 15g carbs, and 0.4g fat. It's a healthy staple in Pakistani diet.",
  dal: "Dal is highly nutritious! 1 cup cooked masoor dal has ~230 calories, 18g protein, 40g carbs. It's excellent for budget-friendly healthy eating.",
  chicken: "100g of boiled chicken breast has ~165 calories, 31g protein, 0g carbs, 3.6g fat. It's one of the best lean protein sources.",
  rice: "1 cup cooked white rice has ~200 calories, 4g protein, 44g carbs. Brown rice is healthier with more fiber. Portion control is key.",
  exercise: "Combine diet with 150 minutes of moderate exercise weekly. Even 30-minute walks daily can significantly improve metabolic health.",
  water: "Drink 8-10 glasses (2-2.5 liters) of water daily. Proper hydration aids digestion, metabolism, and energy levels.",
  hello: "Hello! I'm DIETORA's nutrition assistant. Ask me about calories, diabetes diet, protein sources, Pakistani foods, BMI, or budget meal planning!",
  hi: "Hi there! How can I help you with your nutrition questions today? I know all about Pakistani foods, diseases, and healthy eating!",
  default: "I can help with nutrition questions about Pakistani foods, calories, diabetes/hypertension diet, BMI, protein, and budget meal planning. What would you like to know?",
}

function getBotResponse(message) {
  const lower = message.toLowerCase()
  for (const [key, response] of Object.entries(ruleResponses)) {
    if (lower.includes(key)) return response
  }
  if (lower.includes('weight') || lower.includes('lose') || lower.includes('gain')) {
    return "For healthy weight management: create a 300-500 calorie deficit for weight loss, or surplus for gain. Focus on whole foods, adequate protein, and regular exercise. DIETORA's meal planner can help!"
  }
  if (lower.includes('breakfast') || lower.includes('lunch') || lower.includes('dinner')) {
    return "Pakistani healthy meal suggestions: Breakfast - egg+roti, or oats with milk. Lunch - dal + 2 roti + salad. Dinner - chicken karahi (small portion) + sabzi + roti. Use DIETORA's meal plan generator for personalized plans!"
  }
  return ruleResponses.default
}

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState: {
    open: false,
    messages: [
      {
        id: 1,
        from: 'bot',
        text: "Hello! I'm DIETORA's AI nutrition assistant. Ask me anything about Pakistani foods, calories, diet for diabetes/hypertension, or budget meal planning!",
        time: new Date().toISOString(),
      }
    ],
  },
  reducers: {
    toggleChatbot(state) {
      state.open = !state.open
    },
    sendMessage(state, action) {
      const userMsg = {
        id: Date.now(),
        from: 'user',
        text: action.payload,
        time: new Date().toISOString(),
      }
      const botMsg = {
        id: Date.now() + 1,
        from: 'bot',
        text: getBotResponse(action.payload),
        time: new Date().toISOString(),
      }
      state.messages.push(userMsg, botMsg)
    },
    clearChat(state) {
      state.messages = [{
        id: 1,
        from: 'bot',
        text: "Chat cleared! How can I help you with nutrition today?",
        time: new Date().toISOString(),
      }]
    },
  },
})

export const { toggleChatbot, sendMessage, clearChat } = chatbotSlice.actions
export default chatbotSlice.reducer
