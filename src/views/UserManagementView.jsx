import { useEffect, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
  Tooltip,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useDispatch, useSelector } from 'react-redux'
import {
  clearEmployeeDeleteError,
  clearEmployeeCreateError,
  clearEmployeeUpdateError,
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from '../controllers/employeeController'
import './UserManagement.css'

const settingsTabs = ['User Management']
const employeeRoles = ['Manager', 'Admin', 'Inspector']

const emptyDraft = { name: '', email: '', password: '', role: 'Inspector' }

function getUserStatus(user) {
  const statusValue = user.statusName ?? user.StatusName ?? user.status ?? user.Status
  if (typeof statusValue === 'number') {
    return { 0: 'Inactive', 1: 'Active', 2: 'Suspended' }[statusValue] || 'Unknown'
  }
  return String(statusValue || 'Active')
}

function MetricCard({ label, value, change, tone = 'green', note }) {
  return (
    <article className="user-metric-card">
      <span className={`metric-status-dot dot-${tone}`} />
      <span className="user-metric-label">{label}</span>
      <strong>{value}</strong>
      <div><span className={`metric-change change-${tone}`}>{change}</span><small>{note}</small></div>
    </article>
  )
}

function UserManagementView() {
  const dispatch = useDispatch()
  const { users, loadStatus, loadError, createStatus, createError, updateStatus, updateError, deleteStatus, deleteError } = useSelector((state) => state.employees)
  const [activeTab, setActiveTab] = useState('User Management')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('All Roles')
  const [statusFilter, setStatusFilter] = useState('All Statuses')
  const [sortOrder, setSortOrder] = useState('Newest First')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState('')
  const [editingUser, setEditingUser] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const rowsPerPage = 10

  useEffect(() => {
    if (loadStatus === 'idle') dispatch(fetchEmployees())
  }, [dispatch, loadStatus])

  const filteredUsers = users
    .filter((user) => {
      const normalizedSearch = search.trim().toLowerCase()
      const matchesSearch = !normalizedSearch || `${user.id} ${user.name} ${user.email}`.toLowerCase().includes(normalizedSearch)
      const matchesRole = roleFilter === 'All Roles' || user.role === roleFilter
      const matchesStatus = statusFilter === 'All Statuses' || getUserStatus(user) === statusFilter
      return matchesSearch && matchesRole && matchesStatus
    })
    .sort((first, second) => {
      if (sortOrder === 'Oldest First') return first.registered.localeCompare(second.registered)
      if (sortOrder === 'Name A-Z') return first.name.localeCompare(second.name)
      return 0
    })

  const currentMonth = new Date().toISOString().slice(0, 7);
  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / rowsPerPage))
  const currentPage = Math.min(page, pageCount)
  const visibleUsers = filteredUsers.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
  const activeUsers = users.filter((user) => getUserStatus(user) === 'Active').length
  const suspendedUsers = users.filter((user) => getUserStatus(user) === 'Suspended').length
  const newUsersThisMonth = users.filter((user) => user.registered.startsWith(currentMonth)).length

  function openCreateDialog() {
    setEditingUser(null)
    setDraft(emptyDraft)
    dispatch(clearEmployeeCreateError())
    setDialog('user')
  }

  function openEditDialog(user) {
    setEditingUser(user)
    setDraft({ name: user.name, email: user.email, password: '', role: user.role, status: getUserStatus(user) })
    dispatch(clearEmployeeUpdateError())
    setDialog('user')
  }

  function openDeleteDialog(user) {
    setPendingDelete(user)
    dispatch(clearEmployeeDeleteError())
    setDialog('delete')
  }

  function closeDialog() {
    setDialog('')
    setPendingDelete(null)
    setDraft(emptyDraft)
    dispatch(clearEmployeeCreateError())
    dispatch(clearEmployeeUpdateError())
    dispatch(clearEmployeeDeleteError())
  }

  async function saveUser(event) {
    event.preventDefault()
    if (editingUser) {
      const { name, email, role, status } = draft
      try {
        await dispatch(updateEmployee({ id: editingUser.id, name, email, role, status, registered: editingUser.registered })).unwrap()
      } catch {
        return
      }
    } else {
      try {
        await dispatch(createEmployee(draft)).unwrap()
      } catch {
        return
      }
      dispatch(fetchEmployees())
      setPage(1)
    }
    closeDialog()
  }

  function toggleUserStatus(user) {
    const nextStatus = getUserStatus(user) === 'Active' ? 'Suspended' : 'Active'
    dispatch(updateEmployee({ ...user, status: nextStatus }))
  }

  async function deleteUser() {
    if (!pendingDelete) return
    try {
      await dispatch(deleteEmployee(pendingDelete.id)).unwrap()
      closeDialog()
    } catch {
      return
    }
  }

  function handleSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  return (
    <div className="user-management-page">
      <header className="user-page-header">
        <div className="user-page-title">
          <div className="user-breadcrumb"><span>Settings</span><b>›</b><strong>User Management</strong></div>
          <h1>User Management</h1>
        </div>
        <div className="user-header-actions">
          <TextField
            className="user-search-field"
            size="small"
            placeholder="Search users by name, ID..."
            value={search}
            onChange={handleSearchChange}
            slotProps={{
              htmlInput: { 'aria-label': 'Search users by name or ID' },
              input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> },
            }}
          />
          <Button className="add-user-button" variant="contained" startIcon={<AddOutlinedIcon />} onClick={openCreateDialog}>Add New User</Button>
        </div>
      </header>

      <div className="user-management-content">
        <nav className="settings-tabs" aria-label="Settings sections" role="tablist">
          {settingsTabs.map((tab) => (
            <button className={activeTab === tab ? 'settings-tab is-selected' : 'settings-tab'} type="button" role="tab" aria-selected={activeTab === tab} key={tab} onClick={() => setActiveTab(tab)}>{tab}</button>
          ))}
        </nav>

        <>
            <section className="user-metrics-grid" aria-label="User account summary">
              <MetricCard label="TOTAL USERS" value={users.length.toLocaleString()} change="+12.4%" note="registered transit users" tone="teal" />
              <MetricCard label="ACTIVE USERS" value={activeUsers.toLocaleString()} change="93.5% Rate" note="currently on system" tone="green" />
              <MetricCard label="SUSPENDED" value={suspendedUsers.toLocaleString()} change="4.4% Rate" note="accounts flagged/inactive" tone="red" />
              <MetricCard label="NEW THIS MONTH" value={newUsersThisMonth.toLocaleString()} change="+15.2%" note="registered in Oct 2026" tone="orange" />
            </section>

            <section className="user-directory-panel">
                <div className="directory-toolbar">
                  <h2>User Directory</h2>
                  <TextField select size="small" label="Role" value={roleFilter} onChange={(event) => { setRoleFilter(event.target.value); setPage(1) }}>
                    {['All Roles', 'Passenger', 'Inspector', 'Manager', 'Admin'].map((role) => <MenuItem value={role} key={role}>{role}</MenuItem>)}
                  </TextField>
                  <TextField select size="small" label="Status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
                    {['All Statuses', 'Active', 'Suspended', 'Inactive'].map((status) => <MenuItem value={status} key={status}>{status}</MenuItem>)}
                  </TextField>
                  <TextField select className="sort-select" size="small" label="Sort" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
                    {['Newest First', 'Oldest First', 'Name A-Z'].map((sort) => <MenuItem value={sort} key={sort}>{sort}</MenuItem>)}
                  </TextField>
                </div>

                {loadStatus === 'failed' && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => dispatch(fetchEmployees())}>Retry</Button>}>{loadError}</Alert>}
                {updateError && <Alert severity="error">{updateError}</Alert>}
                <div className="user-table-wrap">
                  <table className="user-directory-table">
                    <thead><tr><th>User ID</th><th>Full name</th><th>Email</th><th>Role</th><th>Status</th><th>Reg. date</th><th aria-label="User actions" /></tr></thead>
                    <tbody>
                      {loadStatus === 'loading' && <tr><td className="user-empty-state" colSpan="7">Loading users…</td></tr>}
                      {loadStatus !== 'loading' && visibleUsers.map((user) => (
                        <tr key={user.id}>
                          <th scope="row">{user.id}</th>
                          <td>{user.name}</td>
                          <td className="user-email" title={user.email}>{user.email}</td>
                          <td><span className={`role-badge role-${user.role.toLowerCase()}`}>{user.role}</span></td>
                          <td><span className={`status-badge status-${getUserStatus(user).toLowerCase()}`}>{getUserStatus(user)}</span></td>
                          <td>{user.registered}</td>
                          <td className="user-row-actions">
                            {user.role?.trim().toLowerCase() !== 'passenger' && (
                              <>
                                <Tooltip title="Edit user"><IconButton size="small" aria-label={`Edit ${user.id}`} onClick={() => openEditDialog(user)}><EditOutlinedIcon /></IconButton></Tooltip>
                                <Tooltip title={getUserStatus(user) === 'Active' ? 'Suspend user' : 'Activate user'}><IconButton size="small" aria-label={`${getUserStatus(user) === 'Active' ? 'Suspend' : 'Activate'} ${user.id}`} onClick={() => toggleUserStatus(user)}><BlockOutlinedIcon /></IconButton></Tooltip>
                                <Tooltip title="Delete user"><IconButton size="small" aria-label={`Delete ${user.id}`} onClick={() => openDeleteDialog(user)}><DeleteOutlineOutlinedIcon /></IconButton></Tooltip>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                      {loadStatus === 'succeeded' && !visibleUsers.length && <tr><td className="user-empty-state" colSpan="7">No users match these filters.</td></tr>}
                    </tbody>
                  </table>
                </div>

                <footer className="user-pagination">
                  <span>Showing {filteredUsers.length ? (currentPage - 1) * rowsPerPage + 1 : 0}-{Math.min(currentPage * rowsPerPage, filteredUsers.length)} of {filteredUsers.length.toLocaleString()} users</span>
                  <div>
                    <Button size="small" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeftOutlinedIcon />Previous</Button>
                    <span className="page-index">{currentPage} / {pageCount}</span>
                    <Button size="small" disabled={currentPage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>Next<ChevronRightOutlinedIcon /></Button>
                  </div>
                </footer>
            </section>
        </>
      </div>

      <Dialog open={dialog === 'user'} onClose={closeDialog} fullWidth maxWidth="sm">
        <form onSubmit={saveUser}>
          <DialogTitle>{editingUser ? 'Edit user' : 'Add new user'}</DialogTitle>
          <DialogContent className="user-form-fields">
            <TextField label="Full name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required fullWidth autoFocus />
            <TextField label="Email address" type="email" value={draft.email} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required fullWidth />
            <TextField select label="Role" value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} fullWidth>
              {[...employeeRoles, ...(editingUser?.role === 'Passenger' ? ['Passenger'] : [])].map((role) => <MenuItem value={role} key={role}>{role}</MenuItem>)}
            </TextField>
            {!editingUser && <TextField label="Password" type="password" autoComplete="new-password" value={draft.password} onChange={(event) => setDraft({ ...draft, password: event.target.value })} required fullWidth />}
            {editingUser && <TextField select label="Status" value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value })} fullWidth>
              {['Active', 'Suspended', 'Inactive'].map((status) => <MenuItem value={status} key={status}>{status}</MenuItem>)}
            </TextField>}
            {!editingUser && createError && <Alert className="employee-create-error" severity="error">{createError}</Alert>}
            {editingUser && updateError && <Alert className="employee-create-error" severity="error">{updateError}</Alert>}
          </DialogContent>
          <DialogActions><Button onClick={closeDialog}>Cancel</Button><Button type="submit" variant="contained" disabled={editingUser ? updateStatus === 'loading' : createStatus === 'loading'}>{editingUser ? (updateStatus === 'loading' ? 'Saving…' : 'Save changes') : (createStatus === 'loading' ? 'Creating…' : 'Create user')}</Button></DialogActions>
        </form>
      </Dialog>

      <Dialog open={dialog === 'delete'} onClose={closeDialog}>
        <DialogTitle className="delete-dialog-title">
          <span className="delete-dialog-icon"><DeleteOutlineOutlinedIcon /></span>
          <span>Delete this user?</span>
        </DialogTitle>
        <DialogContent className="delete-dialog-content">
          <p>This will permanently remove the following account from the user directory.</p>
          <div className="delete-user-summary">
            <strong>{pendingDelete?.name}</strong>
            <span>{pendingDelete?.email}</span>
            <small>{pendingDelete?.id}</small>
          </div>
          {deleteError && <Alert className="delete-dialog-error" severity="error">{deleteError}</Alert>}
        </DialogContent>
        <DialogActions className="delete-dialog-actions">
          <Button onClick={closeDialog} disabled={deleteStatus === 'loading'}>Cancel</Button>
          <Button className="confirm-delete-button" variant="contained" startIcon={<DeleteOutlineOutlinedIcon />} onClick={deleteUser} disabled={deleteStatus === 'loading'}>
            {deleteStatus === 'loading' ? 'Deleting…' : 'Delete user'}
          </Button>
        </DialogActions>
      </Dialog>

    </div>
  )
}

export default UserManagementView
