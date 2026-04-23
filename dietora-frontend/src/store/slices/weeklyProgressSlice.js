// src/store/slices/weeklyProgressSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Thunks ───────────────────────────────────────────────

export const initWeeklyProgress = createAsyncThunk(
  'weeklyProgress/init',
  async (mealPlanId, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/progress/init', { mealPlanId })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to initialize progress tracker')
    }
  }
)

export const fetchActiveProgress = createAsyncThunk(
  'weeklyProgress/fetchActive',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/progress/active')
      return data
    } catch (err) {
      if (err.response?.status === 404) return null
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch progress')
    }
  }
)

export const fetchAllProgress = createAsyncThunk(
  'weeklyProgress/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/progress')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch progress history')
    }
  }
)

export const toggleMealCompletion = createAsyncThunk(
  'weeklyProgress/toggleMeal',
  async ({ progressId, day, mealType, completed }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/progress/${progressId}/check`, {
        day,
        mealType,
        completed,
      })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update meal status')
    }
  }
)

export const submitWeeklyCheckIn = createAsyncThunk(
  'weeklyProgress/checkIn',
  async ({ progressId, checkInData }, { rejectWithValue }) => {
    try {
      const { data } = await api.post(`/progress/${progressId}/checkin`, checkInData)
      toast.success('Check-in submitted! Your new meal plan is ready! 🎉')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to submit check-in')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────

const weeklyProgressSlice = createSlice({
  name: 'weeklyProgress',
  initialState: {
    active: null,          // current week's progress object
    history: [],           // past weeks
    loading: false,
    toggling: false,       // meal checkbox toggling
    submittingCheckIn: false,
    error: null,
    showCheckInModal: false,
    checkInResult: null,   // result after check-in (new plan data)
  },
  reducers: {
    openCheckInModal(state) {
      state.showCheckInModal = true
    },
    closeCheckInModal(state) {
      state.showCheckInModal = false
    },
    clearCheckInResult(state) {
      state.checkInResult = null
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    // Init
    builder
      .addCase(initWeeklyProgress.pending, (state) => { state.loading = true })
      .addCase(initWeeklyProgress.fulfilled, (state, action) => {
        state.loading = false
        state.active = action.payload?.data || action.payload
      })
      .addCase(initWeeklyProgress.rejected, (state, action) => {
        state.loading = false
        // Not a fatal error — progress may already exist
      })

    // Fetch active
    builder
      .addCase(fetchActiveProgress.pending, (state) => { state.loading = true })
      .addCase(fetchActiveProgress.fulfilled, (state, action) => {
        state.loading = false
        state.active = action.payload?.data || action.payload
      })
      .addCase(fetchActiveProgress.rejected, (state) => {
        state.loading = false
        state.active = null
      })

    // Fetch all
    builder
      .addCase(fetchAllProgress.fulfilled, (state, action) => {
        state.history = action.payload?.data || []
      })

    // Toggle meal
    builder
      .addCase(toggleMealCompletion.pending, (state) => { state.toggling = true })
      .addCase(toggleMealCompletion.fulfilled, (state, action) => {
        state.toggling = false
        state.active = action.payload?.data || action.payload
      })
      .addCase(toggleMealCompletion.rejected, (state, action) => {
        state.toggling = false
        toast.error(action.payload || 'Failed to update')
      })

    // Submit check-in
    builder
      .addCase(submitWeeklyCheckIn.pending, (state) => { state.submittingCheckIn = true })
      .addCase(submitWeeklyCheckIn.fulfilled, (state, action) => {
        state.submittingCheckIn = false
        state.showCheckInModal = false
        state.checkInResult = action.payload?.data || action.payload
        // Move current week to history
        if (state.active) state.history = [state.active, ...state.history]
        state.active = null
      })
      .addCase(submitWeeklyCheckIn.rejected, (state, action) => {
        state.submittingCheckIn = false
        toast.error(action.payload || 'Check-in failed')
      })
  },
})

export const { openCheckInModal, closeCheckInModal, clearCheckInResult, clearError } =
  weeklyProgressSlice.actions
export default weeklyProgressSlice.reducer
