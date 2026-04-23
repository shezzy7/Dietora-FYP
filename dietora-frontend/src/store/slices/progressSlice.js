// src/store/slices/progressSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Thunks ───────────────────────────────────────────────

export const initProgress = createAsyncThunk('progress/init', async (mealPlanId, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/progress/init', { mealPlanId })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to init progress')
  }
})

export const fetchCurrentProgress = createAsyncThunk('progress/fetchCurrent', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/progress/current')
    return data
  } catch (err) {
    if (err.response?.status === 404) return null
    return rejectWithValue(err.response?.data?.message)
  }
})

export const fetchAllProgress = createAsyncThunk('progress/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/progress')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

export const toggleMeal = createAsyncThunk(
  'progress/toggleMeal',
  async ({ progressId, day, mealType, completed }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/progress/${progressId}/day/${day}/meal`, { mealType, completed })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update meal')
    }
  }
)

export const submitCheckIn = createAsyncThunk('progress/submitCheckIn', async ({ progressId, checkIn }, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/progress/${progressId}/checkin`, checkIn)
    toast.success('Health check-in submitted!')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to submit check-in')
  }
})

export const regenerateAfterCheckIn = createAsyncThunk('progress/regenerate', async (progressId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/progress/${progressId}/regenerate`)
    toast.success('New week plan generated! 🎉')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to regenerate plan')
  }
})

// ─── Slice ────────────────────────────────────────────────

const progressSlice = createSlice({
  name: 'progress',
  initialState: {
    current: null,       // current WeeklyProgress
    history: [],         // past WeeklyProgress records
    loading: false,
    toggling: null,      // 'day-mealType' key currently being toggled
    submitting: false,
    regenerating: false,
    showCheckIn: false,  // show end-of-week modal
    error: null,
  },
  reducers: {
    setShowCheckIn(state, action) {
      state.showCheckIn = action.payload
    },
    clearProgressError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Init
      .addCase(initProgress.fulfilled, (state, action) => {
        state.current = action.payload?.data || action.payload
      })

      // Fetch current
      .addCase(fetchCurrentProgress.pending, (state) => { state.loading = true })
      .addCase(fetchCurrentProgress.fulfilled, (state, action) => {
        state.loading = false
        state.current = action.payload?.data || null
        // If week is complete and check-in not done → prompt
        if (state.current?.weekCompleted && !state.current?.checkInCompleted) {
          state.showCheckIn = true
        }
      })
      .addCase(fetchCurrentProgress.rejected, (state) => { state.loading = false })

      // Fetch all
      .addCase(fetchAllProgress.fulfilled, (state, action) => {
        state.history = action.payload?.data || []
      })

      // Toggle meal
      .addCase(toggleMeal.pending, (state, action) => {
        const { day, mealType } = action.meta.arg
        state.toggling = `${day}-${mealType}`
      })
      .addCase(toggleMeal.fulfilled, (state, action) => {
        state.toggling = null
        state.current = action.payload?.data || action.payload
        // Check if week is now complete
        if (state.current?.weekCompleted && !state.current?.checkInCompleted) {
          state.showCheckIn = true
          toast('🎉 Week complete! Please fill in your health check-in.', { icon: '🏆' })
        }
      })
      .addCase(toggleMeal.rejected, (state, action) => {
        state.toggling = null
        toast.error(action.payload || 'Failed to update meal')
      })

      // Submit check-in
      .addCase(submitCheckIn.pending, (state) => { state.submitting = true })
      .addCase(submitCheckIn.fulfilled, (state, action) => {
        state.submitting = false
        state.current = action.payload?.data || action.payload
        state.showCheckIn = false
      })
      .addCase(submitCheckIn.rejected, (state, action) => {
        state.submitting = false
        toast.error(action.payload)
      })

      // Regenerate
      .addCase(regenerateAfterCheckIn.pending, (state) => { state.regenerating = true })
      .addCase(regenerateAfterCheckIn.fulfilled, (state, action) => {
        state.regenerating = false
        const payload = action.payload?.data || action.payload
        state.current = payload?.progress || null
      })
      .addCase(regenerateAfterCheckIn.rejected, (state, action) => {
        state.regenerating = false
        toast.error(action.payload)
      })
  },
})

export const { setShowCheckIn, clearProgressError } = progressSlice.actions
export default progressSlice.reducer
