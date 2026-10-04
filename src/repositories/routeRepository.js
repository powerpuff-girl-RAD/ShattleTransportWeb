import { api } from '../models/api'

export async function createRoute(route) {
  const { data } = await api.post('/routes', route)
  if (data?.success === false) throw new Error(data.message || 'Unable to create this route.')
  return data
}

export async function updateRoute(route) {
  const { data } = await api.put(`/routes/${encodeURIComponent(route.id)}`, {
    routeNumber: route.routeNumber,
    routeName: route.routeName,
    startLocation: route.startLocation,
    endLocation: route.endLocation,
    distanceKm: Number(route.distanceKm),
    stops: route.stops.map((stop, index) => ({
      stopId: stop.stopId,
      stopName: stop.stopName.trim(),
      stopOrder: Number(stop.stopOrder) || index + 1,
      distanceFromStartKm: Number(stop.distanceFromStartKm),
    })),
  })
  if (data?.success === false) throw new Error(data.message || 'Unable to update this route.')
  return data
}

export async function updateRouteStatus(id, currentStatus) {
  if (typeof currentStatus !== 'boolean') throw new TypeError('Route status must be a boolean.')
  const { data } = await api.put(`/routes/${encodeURIComponent(id)}/status`, { currentStatus })
  if (data?.success === false) throw new Error(data.message || 'Unable to update route status.')
  return data
}

export async function getRoutes() {
  const { data } = await api.get('/routes')
  if (data?.success === false) throw new Error(data.message || 'Unable to load routes.')
  return data
}
