import axios from 'axios'

const AUTH_STORAGE_KEY = 'civicTransitAuth'

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

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const session = getStorageSession()
  if (session?.accessToken) config.headers.Authorization = `Bearer ${session.accessToken}`
  return config
})
