// src/store/store.js
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import profileReducer from './slices/profileSlice'
import mealPlanReducer from './slices/mealPlanSlice'
import groceryReducer from './slices/grocerySlice'
import themeReducer from './slices/themeSlice'
import chatbotReducer from './slices/chatbotSlice'
import locationReducer from './slices/locationSlice'
import progressReducer from './slices/progressSlice'
import weeklyProgressReducer from './slices/weeklyProgressSlice'
import onboardingReducer from './slices/onboardingSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    mealPlan: mealPlanReducer,
    grocery: groceryReducer,
    theme: themeReducer,
    chatbot: chatbotReducer,
    location: locationReducer,
    progress: progressReducer,
    weeklyProgress: weeklyProgressReducer,
    onboarding: onboardingReducer,
  },
})
