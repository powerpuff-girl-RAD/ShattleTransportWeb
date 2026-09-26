import axios from 'axios'

const AUTH_STORAGE_KEY = 'civicTransitAuth'

export const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})

function getStorageSession() {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    const storedSession = storage.getItem(AUTH_STORAGE_KEY)
    if (!storedSession) continue

    try {
      return JSON.parse(storedSession)
    } catch {
      storage.removeItem(AUTH_STORAGE_KEY)
    }
  }

  return null
}

api.interceptors.request.use((config) => {
  const session = getStorageSession()
  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`
  }
  return config
})

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  if (!data?.success || !data.accessToken) {
    throw new Error(data?.message || 'We could not verify those credentials.')
  }
  return data
}

export async function registerUserAccount(employee) {
  const { data } = await api.post('/auth/register', employee)
  if (data?.success === false) {
    throw new Error(data.message || 'Unable to create this employee account.')
  }
  return data
}

export async function getUsers() {
  const { data } = await api.get('/users')
  if (data?.success === false) {
    throw new Error(data.message || 'Unable to load users.')
  }
  return data
}

export async function updateUserAccount(employee) {
  const { data } = await api.put(`/users/${employee.id}`, employee)
  if (data?.success === false) {
    throw new Error(data.message || 'Unable to update this employee.')
  }
  return data
}

export async function deleteUserAccount(id) {
  const { data } = await api.delete(`/users/${encodeURIComponent(id)}`)
  if (data?.success === false) {
    throw new Error(data.message || 'Unable to delete this user.')
  }
  return data
}

export function readAuthSession() {
  return getStorageSession()
}

export function saveAuthSession(session, rememberMe) {
  clearAuthSession()
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
