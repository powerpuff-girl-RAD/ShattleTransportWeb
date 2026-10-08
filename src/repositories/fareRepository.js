import { api } from '../models/api.js'

export async function getFareConfig(routeId) {
  const { data } = await api.get('/fare/', { params: routeId ? { routeId } : undefined })
  if (data?.success === false) throw new Error(data.message || 'Unable to load fare settings.')
  return data
}

export async function updateFareConfig(config) {
  const { data } = await api.put('/fare/', config)
  if (data?.success === false) throw new Error(data.message || 'Unable to save fare settings.')
  return data
}
