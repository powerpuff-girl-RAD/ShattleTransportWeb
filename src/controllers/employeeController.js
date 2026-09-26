import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { deleteUserAccount, getUsers, registerUserAccount, updateUserAccount } from '../models/authModel'

function normalizeUser(user, index) {
  const isActive = user.isActive ?? user.IsActive
  const statusValue = user.statusName ?? user.StatusName ?? user.status ?? user.Status
  const statusLabels = { 0: 'Inactive', 1: 'Active', 2: 'Suspended' }
  const statusName = typeof statusValue === 'number'
    ? statusLabels[statusValue] || 'Unknown'
    : statusValue || (isActive === false ? 'Inactive' : 'Active')
  return {
    id: String(user.id ?? user.Id ?? user._id ?? `USR-${index + 1}`),
    name: user.fullName || user.FullName || user.name || user.Name || user.email || user.Email || '',
    email: user.email || user.Email || '',
    role: user.role || user.Role || '',
    status: statusName,
    registered: String(user.createdAt || user.CreatedAt || user.registeredAt || user.RegisteredAt || user.registered || '—').slice(0, 10),
    StatusName: statusName,
  }
}

export const fetchEmployees = createAsyncThunk(
  'employees/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getUsers()
      const users = Array.isArray(response)
        ? response
        : response.users || response.results || response.data?.users || response.data?.results || response.data
      if (!Array.isArray(users)) {
        return rejectWithValue('The users endpoint returned an unexpected response.')
      }
      return users.map(normalizeUser)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to load users.',
      )
    }
  },
)

export const createEmployee = createAsyncThunk(
  'employees/create',
  async (employee, { rejectWithValue }) => {
    try {
      const response = await registerUserAccount({
        fullName: employee.name,
        email: employee.email,
        password: employee.password,
        role: employee.role,
      })
      const registeredUser = response.user || response.employee || response.data?.user || response.data || {}
      const statusName = registeredUser.StatusName || registeredUser.status || registeredUser.Status || 'Active'

      return {
        id: String(registeredUser.id || registeredUser.Id || registeredUser._id || `USR-${Date.now()}`),
        name: registeredUser.name || registeredUser.Name || registeredUser.fullName || registeredUser.FullName || employee.name,
        email: registeredUser.email || registeredUser.Email || employee.email,
        role: registeredUser.role || registeredUser.Role || employee.role,
        status: statusName,
        StatusName: statusName,
        registered: String(registeredUser.createdAt || registeredUser.CreatedAt || registeredUser.registeredAt || registeredUser.RegisteredAt || new Date().toISOString()).slice(0, 10),
        lastLogin: '—',
      }
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to create this employee account.',
      )
    }
  },
)

export const updateEmployee = createAsyncThunk(
  'employees/update',
  async (employee, { rejectWithValue }) => {
    try {
      const response = await updateUserAccount({
        id: employee.id,
        fullName: employee.name,
        email: employee.email,
        role: employee.role,
        status: employee.status,
      })
      const responseUser = response.data?.data?.user ||
        response.data?.data?.employee ||
        response.data?.data ||
        response.data?.user ||
        response.data?.employee ||
        response.data ||
        response.user ||
        response.employee
      const user = responseUser && typeof responseUser === 'object'
        ? { ...employee, ...responseUser }
        : employee
      return normalizeUser({
        ...user,
        id: user.id ?? employee.id,
        fullName: user.fullName || user.FullName || employee.name,
        email: user.email || user.Email || employee.email,
        role: user.role || user.Role || employee.role,
        StatusName: user.statusName || user.StatusName || user.status || user.Status || employee.status,
        statusName: user.statusName || user.StatusName || user.status || user.Status || employee.status,
        status: user.statusName || user.StatusName || user.status || user.Status || employee.status,
      }, 0)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to update this employee.',
      )
    }
  },
)

export const deleteEmployee = createAsyncThunk(
  'employees/delete',
  async (id, { rejectWithValue }) => {
    try {
      await deleteUserAccount(id)
      return String(id)
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.response?.data?.error ||
          error.message ||
          'Unable to delete this user.',
      )
    }
  },
)

const employeeSlice = createSlice({
  name: 'employees',
  initialState: {
    users: [],
    loadStatus: 'idle',
    loadError: null,
    createStatus: 'idle',
    createError: null,
    updateStatus: 'idle',
    updateError: null,
    deleteStatus: 'idle',
    deleteError: null,
  },
  reducers: {
    clearEmployeeCreateError(state) {
      state.createError = null
    },
    clearEmployeeUpdateError(state) {
      state.updateError = null
    },
    clearEmployeeDeleteError(state) {
      state.deleteError = null
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loadStatus = 'loading'
        state.loadError = null
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loadStatus = 'succeeded'
        state.users = action.payload
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loadStatus = 'failed'
        state.loadError = action.payload || 'Unable to load users.'
      })
      .addCase(createEmployee.pending, (state) => {
        state.createStatus = 'loading'
        state.createError = null
      })
      .addCase(createEmployee.fulfilled, (state, action) => {
        state.createStatus = 'succeeded'
        state.users.unshift(action.payload)
      })
      .addCase(createEmployee.rejected, (state, action) => {
        state.createStatus = 'failed'
        state.createError = action.payload || 'Unable to create this employee account.'
      })
      .addCase(updateEmployee.pending, (state) => {
        state.updateStatus = 'loading'
        state.updateError = null
      })
      .addCase(updateEmployee.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded'
        state.users = state.users.map((user) => user.id === action.payload.id ? action.payload : user)
      })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.updateStatus = 'failed'
        state.updateError = action.payload || 'Unable to update this employee.'
      })
      .addCase(deleteEmployee.pending, (state) => {
        state.deleteStatus = 'loading'
        state.deleteError = null
      })
      .addCase(deleteEmployee.fulfilled, (state, action) => {
        state.deleteStatus = 'succeeded'
        state.users = state.users.filter((user) => user.id !== action.payload)
      })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.deleteStatus = 'failed'
        state.deleteError = action.payload || 'Unable to delete this user.'
      })
  },
})

export const {
  clearEmployeeCreateError,
  clearEmployeeUpdateError,
  clearEmployeeDeleteError,
} = employeeSlice.actions
export default employeeSlice.reducer
