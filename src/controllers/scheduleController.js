import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createSchedule as createScheduleRequest,
  deleteSchedule as deleteScheduleRequest,
  getSchedules as getSchedulesRequest,
  getScheduleById as getScheduleByIdRequest,
  updateSchedule as updateScheduleRequest,
} from '../models/scheduleModel'

function normalizeSchedule(schedule, fallback = {}) {
  const result = schedule?.schedule || schedule?.data?.schedule || schedule?.data || schedule || {}
  const id = String(result.id ?? result.Id ?? fallback.id ?? '')
  return {
    id,
    date: String(result.date ?? result.Date ?? fallback.date ?? ''),
    startTime: String(result.startTime ?? result.StartTime ?? fallback.startTime ?? ''),
    endTime: String(result.endTime ?? result.EndTime ?? fallback.endTime ?? ''),
    routeId: String(result.routeId ?? result.RouteId ?? fallback.routeId ?? ''),
    vehicleId: String(result.vehicleId ?? result.VehicleId ?? fallback.vehicleId ?? ''),
    inspectorId: String(result.inspectorId ?? result.InspectorId ?? fallback.inspectorId ?? ''),
    status: String(result.status ?? result.Status ?? fallback.status ?? ''),
    qrCode: String(result.qrCode ?? result.QrCode ?? result.qrcode ?? result.qr_code ?? result.QRCode ?? fallback.qrCode ?? ''),
  }
}

function unwrapSchedules(response) {
  let result = response
  for (let depth = 0; depth < 3 && result && !Array.isArray(result); depth += 1) {
    if (result.schedules) result = result.schedules
    else if (result.results) result = result.results
    else if (result.data !== undefined) result = result.data
    else break
  }
  return Array.isArray(result) ? result : null
}

function getError(error, fallback) {
  return error.response?.data?.message || error.response?.data?.error || error.message || fallback
}

export const fetchSchedules = createAsyncThunk('schedules/fetchAll', async (_, { rejectWithValue }) => {
  try {
    const response = await getSchedulesRequest()
    const schedules = unwrapSchedules(response)
    if (!schedules) return rejectWithValue('The schedules endpoint returned an unexpected response.')
    return schedules.map((schedule) => normalizeSchedule(schedule))
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to load schedules.'))
  }
})

export const fetchScheduleById = createAsyncThunk('schedules/fetchOne', async (id, { rejectWithValue }) => {
  try {
    return normalizeSchedule(await getScheduleByIdRequest(id))
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to load this schedule.'))
  }
})

export const createSchedule = createAsyncThunk('schedules/create', async (schedule, { rejectWithValue }) => {
  try {
    const response = await createScheduleRequest(schedule)
    return normalizeSchedule(response, schedule)
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to create this schedule.'))
  }
})

export const updateSchedule = createAsyncThunk('schedules/update', async (schedule, { rejectWithValue }) => {
  try {
    const response = await updateScheduleRequest(schedule)
    return normalizeSchedule(response, schedule)
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to update this schedule.'))
  }
})

export const deleteSchedule = createAsyncThunk('schedules/delete', async (scheduleId, { rejectWithValue }) => {
  try {
    await deleteScheduleRequest(scheduleId)
    return String(scheduleId)
  } catch (error) {
    return rejectWithValue(getError(error, 'Unable to remove this schedule.'))
  }
})

const scheduleSlice = createSlice({
  name: 'schedules',
  initialState: { schedules: [], loadStatus: 'idle', loadError: null, createStatus: 'idle', createError: null, updateStatus: 'idle', updateError: null, deleteStatus: 'idle', deleteError: null },
  reducers: {
    clearScheduleCreateError(state) { state.createError = null },
    clearScheduleUpdateError(state) { state.updateError = null },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchSchedules.pending, (state) => { state.loadStatus = 'loading'; state.loadError = null })
      .addCase(fetchSchedules.fulfilled, (state, action) => { state.loadStatus = 'succeeded'; state.schedules = action.payload })
      .addCase(fetchSchedules.rejected, (state, action) => { state.loadStatus = 'failed'; state.loadError = action.payload || 'Unable to load schedules.' })
      .addCase(createSchedule.pending, (state) => { state.createStatus = 'loading'; state.createError = null })
      .addCase(createSchedule.fulfilled, (state, action) => { state.createStatus = 'succeeded'; state.schedules.push(action.payload) })
      .addCase(createSchedule.rejected, (state, action) => { state.createStatus = 'failed'; state.createError = action.payload || 'Unable to create this schedule.' })
      .addCase(updateSchedule.pending, (state) => { state.updateStatus = 'loading'; state.updateError = null })
      .addCase(updateSchedule.fulfilled, (state, action) => { state.updateStatus = 'succeeded'; state.schedules = state.schedules.map((schedule) => (schedule.id === action.payload.id ? action.payload : schedule)) })
      .addCase(updateSchedule.rejected, (state, action) => { state.updateStatus = 'failed'; state.updateError = action.payload || 'Unable to update this schedule.' })
      .addCase(deleteSchedule.pending, (state) => { state.deleteStatus = 'loading'; state.deleteError = null })
      .addCase(deleteSchedule.fulfilled, (state, action) => { state.deleteStatus = 'succeeded'; state.schedules = state.schedules.filter((schedule) => schedule.id !== action.payload) })
      .addCase(deleteSchedule.rejected, (state, action) => { state.deleteStatus = 'failed'; state.deleteError = action.payload || 'Unable to remove this schedule.' })
  },
})

export const { clearScheduleCreateError, clearScheduleUpdateError } = scheduleSlice.actions
export default scheduleSlice.reducer
