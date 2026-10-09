import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { createVehicle as createVehicleRequest, deleteVehicle as deleteVehicleRequest, getVehicles as getVehiclesRequest, updateVehicle as updateVehicleRequest } from '../services/vehicleService'

function normalizeVehicle(vehicle, fallback) {
  const result = vehicle?.vehicle || vehicle?.data?.vehicle || vehicle?.data || vehicle || {}
  const rawType = result.type ?? result.vehicleType ?? result.Type ?? fallback.type
  const type = rawType === 1 || rawType === '1' ? 'Bus' : rawType === 2 || rawType === '2' ? 'Train' : String(rawType)
  const id = String(result.id ?? result.Id ?? fallback.id)
  const vehicleId = String(result.vehicleId ?? result.VehicleId ?? fallback.vehicleId ?? id)
  const rawSeats = result.seats ?? result.seat ?? result.Seats ?? result.Seat ?? fallback.seats
  const seats = Number(rawSeats) || 0
  return {
    name: String(result.name ?? result.vehicleName ?? result.Name ?? fallback.name),
    vehicleId,
    id,
    depot: String(result.depot ?? result.Depot ?? fallback.depot),
    type,
    status: String(result.status ?? result.Status ?? fallback.status),
    seats,
  }
}

function unwrapVehicles(response) {
  let result = response
  for (let depth = 0; depth < 3 && result && !Array.isArray(result); depth += 1) {
    if (result.vehicles) result = result.vehicles
    else if (result.results) result = result.results
    else if (result.data !== undefined) result = result.data
    else break
  }
  return Array.isArray(result) ? result : null
}

function getError(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || error.message || fallback
}

export const createVehicle = createAsyncThunk('vehicles/create', async (vehicle, { dispatch, rejectWithValue }) => {
  try {
    const response = await createVehicleRequest(vehicle)
    const saved = normalizeVehicle(response, vehicle)
    const refreshed = fetchVehicles.fulfilled.match(await dispatch(fetchVehicles()))
    return { saved, refreshed }
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to create this vehicle.'))
  }
})

export const fetchVehicles = createAsyncThunk('vehicles/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await getVehiclesRequest()
    const vehicles = unwrapVehicles(response)
    if (!vehicles) return rejectWithValue('The vehicles endpoint returned an unexpected response.')
    return vehicles.map((vehicle, index) => normalizeVehicle(vehicle, { id: `vehicle-${index + 1}`, vehicleId: `vehicle-${index + 1}`, name: '', category: 'Bus', depot: '', type: 'Bus', status: 'Active', seats: 0 }))
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to load vehicles.'))
  }
})

export const updateVehicle = createAsyncThunk('vehicles/update', async (vehicle, { dispatch, rejectWithValue }) => {
  try {
    const response = await updateVehicleRequest(vehicle)
    const saved = normalizeVehicle(response, vehicle)
    const refreshed = fetchVehicles.fulfilled.match(await dispatch(fetchVehicles()))
    return { saved, refreshed }
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to update this vehicle.'))
  }
})

export const deleteVehicle = createAsyncThunk('vehicles/delete', async (vehicleId, { rejectWithValue }) => {
  try {
    await deleteVehicleRequest(vehicleId)
    return String(vehicleId)
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to remove this vehicle.'))
  }
})

// Only used when the post-save refetch fails.
function upsertVehicle(state, vehicle) {
  const index = state.vehicles.findIndex((item) => item.id === vehicle.id)
  if (index === -1) state.vehicles.push(vehicle)
  else state.vehicles[index] = vehicle
}

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState: { vehicles: [], loadStatus: 'idle', loadError: null, createStatus: 'idle', createError: null, updateStatus: 'idle', updateError: null, deleteStatus: 'idle', deleteError: null },
  reducers: {
    clearVehicleCreateError(state) { state.createError = null },
    clearVehicleUpdateError(state) { state.updateError = null },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchVehicles.pending, (state) => { state.loadStatus = 'loading'; state.loadError = null })
      .addCase(fetchVehicles.fulfilled, (state, action) => { state.loadStatus = 'succeeded'; state.vehicles = action.payload })
      .addCase(fetchVehicles.rejected, (state, action) => { state.loadStatus = 'failed'; state.loadError = action.payload || 'Unable to load vehicles.' })
      .addCase(createVehicle.pending, (state) => { state.createStatus = 'loading'; state.createError = null })
      .addCase(createVehicle.fulfilled, (state, action) => { state.createStatus = 'succeeded'; if (!action.payload.refreshed) upsertVehicle(state, action.payload.saved) })
      .addCase(createVehicle.rejected, (state, action) => { state.createStatus = 'failed'; state.createError = action.payload || 'Unable to create this vehicle.' })
      .addCase(updateVehicle.pending, (state) => { state.updateStatus = 'loading'; state.updateError = null })
      .addCase(updateVehicle.fulfilled, (state, action) => { state.updateStatus = 'succeeded'; if (!action.payload.refreshed) upsertVehicle(state, action.payload.saved) })
      .addCase(updateVehicle.rejected, (state, action) => { state.updateStatus = 'failed'; state.updateError = action.payload || 'Unable to update this vehicle.' })
      .addCase(deleteVehicle.pending, (state) => { state.deleteStatus = 'loading'; state.deleteError = null })
      .addCase(deleteVehicle.fulfilled, (state, action) => { state.deleteStatus = 'succeeded'; state.vehicles = state.vehicles.filter((vehicle) => vehicle.id !== action.payload) })
      .addCase(deleteVehicle.rejected, (state, action) => { state.deleteStatus = 'failed'; state.deleteError = action.payload || 'Unable to remove this vehicle.' })
  },
})

export const { clearVehicleCreateError, clearVehicleUpdateError } = vehicleSlice.actions
export default vehicleSlice.reducer
