import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import toast from 'react-hot-toast'

export const fetchGroceryList = createAsyncThunk('grocery/fetch', async (mealPlanId, { rejectWithValue }) => {
  try {
    // First try to get latest existing list
    const { data } = await api.get('/grocery-list')
    return data
  } catch (err) {
    if (err.response?.status === 404 && mealPlanId) {
      // No list yet — auto-generate from latest meal plan
      try {
        const { data } = await api.post(`/grocery-list/generate/${mealPlanId}`)
        toast.success('Grocery list generated!')
        return data
      } catch (genErr) {
        return rejectWithValue(genErr.response?.data?.message || 'Failed to generate grocery list')
      }
    }
    if (err.response?.status === 404) return null
    return rejectWithValue(err.response?.data?.message)
  }
})

export const regenerateGroceryList = createAsyncThunk('grocery/regenerate', async (mealPlanId, { rejectWithValue }) => {
  try {
    const { data } = await api.post(`/grocery-list/generate/${mealPlanId}`)
    toast.success('Grocery list refreshed!')
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to regenerate list')
  }
})

export const toggleGroceryItemAPI = createAsyncThunk('grocery/toggleItem', async ({ listId, itemId }, { rejectWithValue }) => {
  try {
    const { data } = await api.patch(`/grocery-list/${listId}/item/${itemId}/toggle`)
    return data
  } catch (err) {
    return rejectWithValue(err.response?.data?.message)
  }
})

function extractList(payload) {
  // Handle both direct list and nested data.data
  const raw = payload?.data || payload
  return {
    _id: raw?._id,
    items: raw?.items || [],
    totalCost: raw?.totalEstimatedCost || raw?.totalCost || 0,
    status: raw?.status || 'pending',
    title: raw?.title || 'Weekly Grocery List',
  }
}

const grocerySlice = createSlice({
  name: 'grocery',
  initialState: {
    listId: null,
    items: [],
    totalCost: 0,
    loading: false,
    generating: false,
    checkedItems: {}, // local-only toggle state (client-side)
    error: null,
  },
  reducers: {
    // Local-only toggle (instant UI feedback, no API call needed for simple UI)
    toggleItem(state, action) {
      const id = action.payload
      state.checkedItems[id] = !state.checkedItems[id]
    },
    clearChecked(state) {
      state.checkedItems = {}
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroceryList.pending, (state) => { state.loading = true; state.error = null })
      .addCase(fetchGroceryList.fulfilled, (state, action) => {
        state.loading = false
        if (!action.payload) return
        const { _id, items, totalCost } = extractList(action.payload)
        state.listId = _id
        state.items = items
        state.totalCost = totalCost
      })
      .addCase(fetchGroceryList.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      .addCase(regenerateGroceryList.pending, (state) => { state.generating = true })
      .addCase(regenerateGroceryList.fulfilled, (state, action) => {
        state.generating = false
        const { _id, items, totalCost } = extractList(action.payload)
        state.listId = _id
        state.items = items
        state.totalCost = totalCost
        state.checkedItems = {}
      })
      .addCase(regenerateGroceryList.rejected, (state) => { state.generating = false })
      .addCase(toggleGroceryItemAPI.fulfilled, (state, action) => {
        const { _id, items, totalCost } = extractList(action.payload)
        state.items = items
        state.totalCost = totalCost
      })
  },
})

export const { toggleItem, clearChecked } = grocerySlice.actions
export default grocerySlice.reducer
