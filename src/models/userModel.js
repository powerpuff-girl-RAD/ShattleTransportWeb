import { api } from './api'

export async function registerUserAccount(employee) {
  const { data } = await api.post('/auth/register', employee)
  if (data?.success === false) throw new Error(data.message || 'Unable to create this employee account.')
  return data
}

export async function getUsers() {
  const { data } = await api.get('/users')
  if (data?.success === false) throw new Error(data.message || 'Unable to load users.')
  return data
}

export async function updateUserAccount(employee) {
  const { data } = await api.put(`/users/${employee.id}`, employee)
  if (data?.success === false) throw new Error(data.message || 'Unable to update this employee.')
  return data
}

export async function deleteUserAccount(id) {
  const { data } = await api.delete(`/users/${encodeURIComponent(id)}`)
  if (data?.success === false) throw new Error(data.message || 'Unable to delete this user.')
  return data
}
