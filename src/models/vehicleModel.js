import { api } from './api'

export async function getVehicles() {
  const { data } = await api.get('/vehicles')
  if (data?.success === false) throw new Error(data.message || 'Unable to load vehicles.')
  return data
}

export async function createVehicle(vehicle) {
  const { data } = await api.post('/vehicles', vehicle)
  if (data?.success === false) throw new Error(data.message || 'Unable to create this vehicle.')
  return data
}

export async function updateVehicle(vehicle) {
  const { data } = await api.put(`/vehicles/${vehicle.id}`, vehicle)
  if (data?.success === false) throw new Error(data.message || 'Unable to update this vehicle.')
  return data
}
