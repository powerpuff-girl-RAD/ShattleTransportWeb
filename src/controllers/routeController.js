import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  createRoute as createRouteRequest,
  getRoutes as getRoutesRequest,
  updateRoute as updateRouteRequest,
  updateRouteStatus as updateRouteStatusRequest,
} from '../services/routeService'

function normalizeRoute(route, index = 0) {
  const routeNumber = String(route.routeNumber ?? route.RouteNumber ?? '')
  const distanceKm = Number(route.distanceKm ?? route.DistanceKm ?? 0)
  const stopDetails = (Array.isArray(route.stops) ? route.stops : route.stopDetails || [])
    .map((stop, stopIndex) => ({
      stopName: String(stop.stopName ?? stop.name ?? stop.Name ?? ''),
      stopOrder: Number(stop.stopOrder ?? stop.order ?? stop.Order ?? stopIndex + 1),
      distanceFromStartKm: Number(stop.distanceFromStartKm ?? stop.DistanceFromStartKm ?? 0),
    }))
    .sort((first, second) => first.stopOrder - second.stopOrder)
  const startLocation = String(route.startLocation ?? route.StartLocation ?? '')
  const endLocation = String(route.endLocation ?? route.EndLocation ?? '')
  const timeline = stopDetails.length
    ? stopDetails.map((stop) => stop.stopName)
    : [startLocation, endLocation].filter(Boolean)

  return {
    id: String(route.id ?? route.Id ?? (routeNumber || `route-${index + 1}`)),
    routeNumber,
    name: String(route.routeName ?? route.RouteName ?? ''),
    routeName: String(route.routeName ?? route.RouteName ?? ''),
    startLocation,
    endLocation,
    stops: stopDetails.length,
    stopDetails,
    distanceKm,
    distance: `${distanceKm} km`,
    passengers: String(route.dailyPassengers ?? route.passengers ?? route.Passengers ?? '—'),
    revenue: String(route.revenue ?? route.Revenue ?? '—'),
    timeline,
    //active: route.active ?? route.isActive ?? route.IsActive ?? true,
    active: route.currentStatus ?? true
  }
}

export const fetchRoutes = createAsyncThunk(
  'routes/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getRoutesRequest()
      let result = response
      for (let depth = 0; depth < 3 && result && !Array.isArray(result); depth += 1) {
        if (result.routes) result = result.routes
        else if (result.results) result = result.results
        else if (result.data !== undefined) result = result.data
        else break
      }
      const routes = Array.isArray(result)
        ? result
        : result && typeof result === 'object' && ('routeNumber' in result || 'RouteNumber' in result)
          ? [result]
          : null
      if (!Array.isArray(routes)) {
        return rejectWithValue('The routes endpoint returned an unexpected response.')
      }
      return routes.map(normalizeRoute)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to load routes.',
      )
    }
  },
)

export const createRoute = createAsyncThunk(
  'routes/create',
  async (route, { rejectWithValue }) => {
    try {
      const response = await createRouteRequest({
        routeNumber: route.routeNumber,
        routeName: route.routeName,
        startLocation: route.startLocation,
        endLocation: route.endLocation,
        distanceKm: Number(route.distanceKm),
        stops: route.stops.map((stop, index) => ({
          stopName: stop.stopName.trim(),
          stopOrder: Number(stop.stopOrder) || index + 1,
          distanceFromStartKm: Number(stop.distanceFromStartKm),
        })),
      })
      const createdRoute = response?.data?.route || response?.data || response?.route || response
      return normalizeRoute({ ...route, ...(createdRoute || {}) })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to create this route.',
      )
    }
  },
)

export const updateRoute = createAsyncThunk(
  'routes/update',
  async (route, { rejectWithValue }) => {
    try {
      const response = await updateRouteRequest(route)
      const updatedRoute = response?.data?.route ||
        response?.data?.data?.route ||
        response?.data?.data ||
        response?.data ||
        response?.route ||
        response
      return normalizeRoute({ ...route, ...(updatedRoute || {}) })
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to update this route.',
      )
    }
  },
)

export const updateRouteStatus = createAsyncThunk(
  'routes/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      if (typeof status !== 'boolean') {
        return rejectWithValue('Route status must be a boolean.')
      }
      await updateRouteStatusRequest(id, status)
      return { id: String(id), active: status }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to update route status.',
      )
    }
  },
)

const routeSlice = createSlice({
  name: 'routes',
  initialState: {
    routes: [],
    loadStatus: 'idle',
    loadError: null,
    createStatus: 'idle',
    createError: null,
    updateStatus: 'idle',
    updateError: null,
    statusUpdateId: null,
    statusUpdateError: null,
  },
  reducers: {
    clearRouteCreateError(state) {
      state.createError = null
    },
    clearRouteUpdateError(state) {
      state.updateError = null
    },
    clearRouteStatusError(state) {
      state.statusUpdateError = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchRoutes.pending, (state) => {
        state.loadStatus = 'loading'
        state.loadError = null
      })
      .addCase(fetchRoutes.fulfilled, (state, action) => {
        state.loadStatus = 'succeeded'
        state.routes = action.payload
      })
      .addCase(fetchRoutes.rejected, (state, action) => {
        state.loadStatus = 'failed'
        state.loadError = action.payload || 'Unable to load routes.'
      })
      .addCase(createRoute.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createRoute.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        const existingIndex = state.routes.findIndex((route) => route.id === action.payload.id)
        if (existingIndex === -1) state.routes.push(action.payload)
        else state.routes[existingIndex] = action.payload
      })
      .addCase(createRoute.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.createError = action.payload || 'Unable to create this route.'
      })
      .addCase(updateRoute.pending, (state) => {
        state.updateStatus = 'loading'
        state.updateError = null
      })
      .addCase(updateRoute.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.routes = state.routes.map((route) => route.id === action.payload.id ? action.payload : route)
      })
      .addCase(updateRoute.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.updateError = action.payload || 'Unable to update this route.'
      })
      .addCase(updateRouteStatus.pending, (state, action) => {
        state.statusUpdateId = String(action.meta.arg.id)
        state.statusUpdateError = null
      })
      .addCase(updateRouteStatus.fulfilled, (state, action) => {
        const route = state.routes.find((entry) => entry.id === action.payload.id)
        if (route) route.active = action.payload.active
        state.statusUpdateId = null
      })
      .addCase(updateRouteStatus.rejected, (state, action) => {
        state.statusUpdateId = null
        state.statusUpdateError = action.payload || 'Unable to update route status.'
      })
  },
})

export const { clearRouteCreateError, clearRouteUpdateError, clearRouteStatusError } = routeSlice.actions
export default routeSlice.reducer
