import { api } from './api'

export async function getFareConfig(routeId) {
  const { data } = await api.get('/fare/', { params: routeId ? { routeId } : undefined })
  if (data?.success === false) throw new Error(data.message || 'Unable to load fare settings.')
  return data
}

export async function updateFareConfig(config) {
  const { data } = await api.post('/fare/', config)
  if (data?.success === false) throw new Error(data.message || 'Unable to save fare settings.')
  return data
}

