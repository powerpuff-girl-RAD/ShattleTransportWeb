import { api } from './api'

export async function getSchedules() {
  const { data } = await api.get('/schedules')
  if (data?.success === false) throw new Error(data.message || 'Unable to load schedules.')
  return data
}

export async function getScheduleById(id) {
  const { data } = await api.get(`/schedules/${encodeURIComponent(id)}`)
  if (data?.success === false) throw new Error(data.message || 'Unable to load this schedule.')
  return data
}

export async function createSchedule(schedule) {
  const { data } = await api.post('/schedules', schedule)
  if (data?.success === false) throw new Error(data.message || 'Unable to create this schedule.')
  return data
}

export async function updateSchedule(schedule) {
  const { data } = await api.put(`/schedules/${encodeURIComponent(schedule.id)}`, schedule)
  if (data?.success === false) throw new Error(data.message || 'Unable to update this schedule.')
  return data
}

export async function deleteSchedule(id) {
  const { data } = await api.delete(`/schedules/${encodeURIComponent(id)}`)
  if (data?.success === false) throw new Error(data.message || 'Unable to remove this schedule.')
  return data
}
