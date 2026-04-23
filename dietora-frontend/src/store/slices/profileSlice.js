// src/store/slices/profileSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchProfile = createAsyncThunk('profile/fetch', async (_, { rejectWithValue }) => {
  try {
    const { data } = await api.get('/profile')
    return data
  } catch (err) {
    if (err.response?.status === 404) return null
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile')
  }
})

export const saveProfile = createAsyncThunk('profile/save', async (profileData, { getState, rejectWithValue }) => {
  try {
    const existing = getState().profile.data
    const method = existing ? 'put' : 'post'
    const { data } = await api[method]('/profile', profileData)
    toast.success(existing ? 'Health profile updated!' : 'Health profile created!')
    return data
  } catch (err) {
    const msg = err.response?.data?.message || 'Failed to save profile'
    return rejectWithValue(msg)
  }
})

const initialState = {
  data: null,
  loading: false,
  saving: false,
  error: null,
}

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearProfile(state) {
      state.data = null
    },
    resetState() {
      return initialState
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false
        state.data = action.payload?.data?.healthProfile || action.payload?.data || action.payload
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(saveProfile.pending, (state) => { state.saving = true; state.error = null })
      .addCase(saveProfile.fulfilled, (state, action) => {
        state.saving = false
        state.data = action.payload?.data?.healthProfile || action.payload?.data || action.payload
      })
      .addCase(saveProfile.rejected, (state, action) => {
        state.saving = false
        state.error = action.payload
        toast.error(action.payload)
      })
  },
})

export const { clearProfile, resetState: resetProfile } = profileSlice.actions
export default profileSlice.reducer
