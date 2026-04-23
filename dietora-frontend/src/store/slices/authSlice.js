// src/store/slices/authSlice.js

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Thunks ───────────────────────────────────────────────

export const loginUser = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/login', credentials)
    localStorage.setItem('dietora_token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed')
  }
})

export const registerUser = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/register', userData)
    localStorage.setItem('dietora_token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed')
  }
})

export const googleLogin = createAsyncThunk('auth/google', async ({ accessToken }, { rejectWithValue }) => {
  try {
    const { data } = await api.post('/auth/google', { accessToken })
    localStorage.setItem('dietora_token', data.token)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Google sign-in failed')
  }
})

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/auth/me')
    return data
  } catch (err) {
    localStorage.removeItem('dietora_token')
    return rejectWithValue(err.response?.data?.message || 'Session expired')
  }
})

/**
 * deleteAccount
 * Calls DELETE /api/v1/auth/delete-account
 * Local users must supply { password }; Google users pass {}
 * On success, clears token + Redux state across all slices.
 */
export const deleteAccount = createAsyncThunk('auth/deleteAccount', async (payload, { rejectWithValue, dispatch }) => {
  try {
    const { data } = await api.delete('/auth/delete-account', { data: payload })
    localStorage.removeItem('dietora_token')
    // Reset every other slice so no stale data lingers in memory
    dispatch({ type: 'profile/resetState' })
    dispatch({ type: 'mealPlan/resetState' })
    dispatch({ type: 'grocery/resetState' })
    dispatch({ type: 'progress/resetState' })
    dispatch({ type: 'weeklyProgress/resetState' })
    dispatch({ type: 'location/resetState' })
    dispatch({ type: 'onboarding/resetState' })
    dispatch({ type: 'chatbot/resetState' })
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Account deletion failed. Please try again.')
  }
})

// ─── Slice ────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('dietora_token'),
    loading: false,
    initialized: false,
    deletingAccount: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null
      state.token = null
      state.initialized = true
      localStorage.removeItem('dietora_token')
      toast.success('Logged out successfully')
    },
    clearError(state) {
      state.error = null
    },
  },
  extraReducers: (builder) => {

    // ── Login ────────────────────────────────────────────
    builder
      .addCase(loginUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        const first = action.payload.user?.name?.split(' ')[0] || 'there'
        toast.success(`Welcome back, ${first}!`)
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── Register ─────────────────────────────────────────
    builder
      .addCase(registerUser.pending, (state) => { state.loading = true; state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        toast.success('Account created! Welcome to DIETORA 🥗')
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload)
      })

    // ── Google Login ──────────────────────────────────────
    builder
      .addCase(googleLogin.pending, (state) => { state.loading = true; state.error = null })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        state.token = action.payload.token
        state.initialized = true
        toast.success(action.payload.message || 'Signed in with Google!')
      })
      .addCase(googleLogin.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        toast.error(action.payload || 'Google sign-in failed. Please try again.')
      })

    // ── Fetch Me ─────────────────────────────────────────
    builder
      .addCase(fetchMe.pending, (state) => { state.loading = true })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload?.data || action.payload?.user || action.payload
        state.initialized = true
      })
      .addCase(fetchMe.rejected, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.initialized = true
      })

    // ── Delete Account ────────────────────────────────────
    builder
      .addCase(deleteAccount.pending, (state) => {
        state.deletingAccount = true
        state.error = null
      })
      .addCase(deleteAccount.fulfilled, (state) => {
        state.deletingAccount = false
        state.user = null
        state.token = null
        state.initialized = true
        toast.success('Your account has been permanently deleted.')
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deletingAccount = false
        state.error = action.payload
        toast.error(action.payload)
      })
  },
})

export const { logout, clearError } = authSlice.actions
export default authSlice.reducer
