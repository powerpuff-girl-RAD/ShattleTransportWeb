import { api } from './api'

const AUTH_STORAGE_KEY = 'civicTransitAuth'

export async function login(credentials) {
  const { data } = await api.post('/auth/login', credentials)
  if (!data?.success || !data.accessToken) throw new Error(data?.message || 'We could not verify those credentials.')
  return data
}

export function readAuthSession() {
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

export function saveAuthSession(session, rememberMe) {
  clearAuthSession()
  const storage = rememberMe ? window.localStorage : window.sessionStorage
  storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY)
}
