import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import {
  clearAuthSession,
  login,
  readAuthSession,
  saveAuthSession,
} from '../models/authModel'

const storedSession = readAuthSession()

export const loginManager = createAsyncThunk(
  'auth/login',
  async ({ email, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await login({ email, password })
      if (response.user?.role?.trim().toLowerCase() !== 'manager') {
        clearAuthSession()
        return rejectWithValue({
          code: 'ROLE_FORBIDDEN',
          message: 'This account is not assigned the Manager role.',
        })
      }
      const session = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        user: response.user,
      }
      saveAuthSession(session, rememberMe)
      return session
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to sign in. Please try again.',
      )
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    accessToken: storedSession?.accessToken ?? null,
    refreshToken: storedSession?.refreshToken ?? null,
    user: storedSession?.user ?? null,
    status: 'idle',
    error: null,
  },
  reducers: {
    clearSession(state) {
      state.accessToken = null
      state.refreshToken = null
      state.user = null
      state.status = 'idle'
      state.error = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loginManager.pending, (state) => {
        state.status = 'loading'
        state.error = null
      })
      .addCase(loginManager.fulfilled, (state, action) => {
        state.accessToken = action.payload.accessToken
        state.refreshToken = action.payload.refreshToken
        state.user = action.payload.user
        state.status = 'succeeded'
      })
      .addCase(loginManager.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'Unable to sign in. Please try again.'
      })
  },
})

const { clearSession } = authSlice.actions

export function signOut() {
  return (dispatch) => {
    clearAuthSession()
    dispatch(clearSession())
  }
}

export default authSlice.reducer
