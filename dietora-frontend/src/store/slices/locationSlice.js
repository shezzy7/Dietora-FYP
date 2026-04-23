// src/store/slices/locationSlice.js
// Location state — GPS consent, coordinates, city
// Store search results are managed locally in components (Google Places live data)

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ─── Async Thunks ─────────────────────────────────────────

export const saveLocation = createAsyncThunk(
  'location/save',
  async (locationData, { rejectWithValue }) => {
    try {
      const res = await api.post('/location/consent', locationData)
      return res.data.data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to save location')
    }
  }
)

export const fetchMyLocation = createAsyncThunk(
  'location/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const res = await api.get('/location/me')
      return res.data.data
    } catch {
      return rejectWithValue(null)
    }
  }
)

export const revokeLocation = createAsyncThunk(
  'location/revoke',
  async (_, { rejectWithValue }) => {
    try {
      await api.delete('/location/consent')
      return true
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to revoke')
    }
  }
)

export const setManualCity = createAsyncThunk(
  'location/setCity',
  async (city, { rejectWithValue }) => {
    try {
      await api.post('/location/manual-city', { city })
      return city
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to set city')
    }
  }
)

// ─── Slice ────────────────────────────────────────────────
const locationSlice = createSlice({
  name: 'location',
  initialState: {
    hasConsent: false,
    locationAsked: false,
    // GPS coordinates (saved after successful grant)
    coordinates: null,          // { latitude, longitude }
    resolvedCity: '',
    resolvedArea: '',
    resolvedAddress: '',
    manualCity: '',
    accuracy: null,
    lastUpdated: null,
    // UI
    loading: false,
    error: null,
    showLocationModal: false,
  },
  reducers: {
    showLocationPrompt(state) {
      state.showLocationModal = true
    },
    hideLocationPrompt(state) {
      state.showLocationModal = false
      state.locationAsked = true
    },
    setLocationAsked(state) {
      state.locationAsked = true
    },
    // Called immediately when GPS coords are obtained (before backend save)
    setCoordinates(state, action) {
      state.coordinates = action.payload
    },
  },
  extraReducers: (builder) => {
    // saveLocation
    builder
      .addCase(saveLocation.pending, (state) => { state.loading = true; state.error = null })
      .addCase(saveLocation.fulfilled, (state, action) => {
        state.loading = false
        state.hasConsent = true
        state.locationAsked = true
        state.showLocationModal = false
        if (action.payload?.coordinates) {
          state.coordinates = {
            longitude: action.payload.coordinates[0],
            latitude: action.payload.coordinates[1],
          }
        }
        state.resolvedCity = action.payload?.resolvedCity || ''
        state.resolvedArea = action.payload?.resolvedArea || ''
        state.lastUpdated = new Date().toISOString()
        toast.success('Location saved!')
      })
      .addCase(saveLocation.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

    // fetchMyLocation
    builder
      .addCase(fetchMyLocation.fulfilled, (state, action) => {
        if (action.payload) {
          state.hasConsent = action.payload.locationConsent || false
          state.resolvedCity = action.payload.resolvedCity || ''
          state.resolvedArea = action.payload.resolvedArea || ''
          state.resolvedAddress = action.payload.resolvedAddress || ''
          state.manualCity = action.payload.manualCity || ''
          state.lastUpdated = action.payload.lastUpdated
          if (action.payload.coordinates) {
            state.coordinates = {
              longitude: action.payload.coordinates[0],
              latitude: action.payload.coordinates[1],
            }
          }
          state.locationAsked = true
        }
      })
      .addCase(fetchMyLocation.rejected, (state) => {
        // Silently fail — no location saved yet
      })

    // revokeLocation
    builder
      .addCase(revokeLocation.fulfilled, (state) => {
        state.hasConsent = false
        state.coordinates = null
        state.resolvedCity = ''
        state.resolvedArea = ''
        state.resolvedAddress = ''
        toast.success('Location access revoked.')
      })

    // setManualCity
    builder
      .addCase(setManualCity.fulfilled, (state, action) => {
        state.manualCity = action.payload
        state.locationAsked = true
        state.showLocationModal = false
        toast.success(`City set to ${action.payload}`)
      })
  },
})

export const { showLocationPrompt, hideLocationPrompt, setLocationAsked, setCoordinates } = locationSlice.actions
export default locationSlice.reducer
