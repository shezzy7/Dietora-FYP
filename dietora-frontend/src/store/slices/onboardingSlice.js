// src/store/slices/onboardingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const completeOnboarding = createAsyncThunk(
  'onboarding/complete',
  async (onboardingData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/onboarding/complete', onboardingData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save onboarding data')
    }
  }
)

export const checkOnboardingStatus = createAsyncThunk(
  'onboarding/checkStatus',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/onboarding/status')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message)
    }
  }
)

const onboardingSlice = createSlice({
  name: 'onboarding',
  initialState: {
    completed: false,
    loading: false,
    saving: false,
    error: null,
    // In-progress wizard state (client-side only)
    wizardStep: 0,
    wizardData: {},
  },
  reducers: {
    setOnboardingCompleted(state, action) {
      state.completed = action.payload
    },
    setWizardStep(state, action) {
      state.wizardStep = action.payload
    },
    updateWizardData(state, action) {
      state.wizardData = { ...state.wizardData, ...action.payload }
    },
    resetWizard(state) {
      state.wizardStep = 0
      state.wizardData = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(completeOnboarding.pending, (state) => { state.saving = true; state.error = null })
      .addCase(completeOnboarding.fulfilled, (state) => {
        state.saving = false
        state.completed = true
        toast.success('Profile setup complete! Welcome to DIETORA 🥗')
      })
      .addCase(completeOnboarding.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
        toast.error(action.payload || 'Setup failed. Please try again.')
      })
      .addCase(checkOnboardingStatus.fulfilled, (state, action) => {
        state.completed = action.payload?.data?.onboardingCompleted || false
      })
  },
})

export const { setOnboardingCompleted, setWizardStep, updateWizardData, resetWizard } =
  onboardingSlice.actions
export default onboardingSlice.reducer
