import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  TextField,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ChevronLeftOutlinedIcon from '@mui/icons-material/ChevronLeftOutlined'
import ChevronRightOutlinedIcon from '@mui/icons-material/ChevronRightOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import PersonOffOutlinedIcon from '@mui/icons-material/PersonOffOutlined'
import DirectionsBusFilledOutlinedIcon from '@mui/icons-material/DirectionsBusFilledOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined'
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { fetchEmployees } from '../controllers/employeeController'
import { fetchRoutes } from '../controllers/routeController'
import { createSchedule, deleteSchedule, fetchSchedules, updateSchedule } from '../controllers/scheduleController'
import { fetchVehicles } from '../controllers/vehicleController'
import './ServiceManagement.css'
import './VehicleManagement.css'
import './TripAssignment.css'

const statusOptions = ['Confirmed', 'In progress', 'Needs cover', 'Conflict', 'Pending']
const statusTone = { Confirmed: 'mint', 'In progress': 'blue', 'Needs cover': 'orange', Conflict: 'red', Pending: 'orange' }
const PAGE_SIZE = 7

function findName(options, id) {
  return options.find((option) => option.id === id)?.name || ''
}
function findRouteNumber(options, id) {
  return options.find((option) => option.id === id)?.routeNumber || ''
}
function findVehicleNumber(options, id) {
  return options.find((option) => option.id === id)?.vehicleNumber || ''
}
function formatDisplayDate(isoDate) {
  if (!isoDate) return ''
  const date = new Date(`${String(isoDate).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(date)
}
function formatDbTime(value) {
  if (!value) return ''
  const stringValue = String(value)
  if (/^\d{2}:\d{2}/.test(stringValue)) return stringValue.slice(0, 5)
  const date = new Date(stringValue)
  if (!Number.isNaN(date.getTime())) return date.toISOString().substring(11, 16)
  return stringValue
}
function toIsoDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const emptyDraft = { id: null, date: '2026-09-28', startTime: '', endTime: '', routeId: '', vehicleId: '', inspectorId: '', status: 'Confirmed' }

function AssignmentCoverageChart() {
  return (
    <svg className="coverage-chart" viewBox="0 0 220 90" role="img" aria-label="Assignment coverage trend">
      <path className="coverage-line coverage-line-orange" d="M4 66 L58 44 L112 58 L166 30 L216 20" />
      <path className="coverage-line coverage-line-blue" d="M4 30 L64 58 L128 40 L182 66 L216 50" />
      <circle className="coverage-node" cx="58" cy="44" r="4" />
      <circle className="coverage-node" cx="112" cy="58" r="4" />
      <circle className="coverage-node coverage-node-active" cx="166" cy="30" r="5" />
    </svg>
  )
}

function TripAssignmentView() {
  const dispatch = useDispatch()
  const { users: employees, loadStatus: employeeLoadStatus } = useSelector((state) => state.employees)
  const { routes, loadStatus: routeLoadStatus } = useSelector((state) => state.routes)
  const { vehicles, loadStatus: vehicleLoadStatus } = useSelector((state) => state.vehicles)
  const {
    schedules: assignments,
    loadStatus,
    loadError,
    createStatus,
    updateStatus,
    deleteStatus,
    deleteError,
  } = useSelector((state) => state.schedules)
  const [search, setSearch] = useState('')
  const [routeFilter, setRouteFilter] = useState('All routes')
  const [statusFilter, setStatusFilter] = useState('All status')
  const [activeTab, setActiveTab] = useState('all')
  const [page, setPage] = useState(1)
  const [dialog, setDialog] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [error, setError] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => toIsoDate(new Date()))
  const now = new Date()
  const currentDate = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(now)
  const selectedDateLabel = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${selectedDate}T00:00:00`))
  const nowTimeLabel = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(now)
  const servicePeriod = now.getHours() >= 5 && now.getHours() < 12 ? 'Morning' : now.getHours() < 17 ? 'Afternoon' : now.getHours() < 21 ? 'Evening' : 'Night'

  useEffect(() => {
    if (loadStatus === 'idle') dispatch(fetchSchedules())
    if (employeeLoadStatus === 'idle') dispatch(fetchEmployees())
    if (routeLoadStatus === 'idle') dispatch(fetchRoutes())
    if (vehicleLoadStatus === 'idle') dispatch(fetchVehicles())
  }, [dispatch, loadStatus, employeeLoadStatus, routeLoadStatus, vehicleLoadStatus])

  const inspectorOptions = useMemo(
    () => employees
      .filter((employee) => String(employee.role).toLowerCase() === 'inspector')
      .map((employee) => ({ id: employee.id, name: employee.name })),
    [employees],
  )
  const routeOptions = useMemo(
    () => routes
      .filter((route) => route.active === true || route.active === 'Active')
      .map((route) => ({ id: route.id, routeNumber: route.routeNumber || route.id, name: `${route.routeNumber || route.id} · ${route.name}` })),
    [routes],
  )
  const vehicleOptions = useMemo(
    () => vehicles
      .filter((vehicle) => vehicle.status === 'Active')
      .map((vehicle) => ({ id: vehicle.id, vehicleNumber: vehicle.vehicleId, name: vehicle.name })),
    [vehicles],
  )

  function shiftSelectedDate(offsetDays) {
    setSelectedDate((current) => {
      const date = new Date(`${current}T00:00:00`)
      date.setDate(date.getDate() + offsetDays)
      return toIsoDate(date)
    })
    setPage(1)
  }

  const dateAssignments = useMemo(
    () => assignments.filter((assignment) => String(assignment.date).slice(0, 10) === selectedDate),
    [assignments, selectedDate],
  )

  const confirmedCount = dateAssignments.filter((assignment) => assignment.status === 'Confirmed').length
  const pendingCount = dateAssignments.filter((assignment) => assignment.status === 'Pending').length
  const needsAttentionCount = dateAssignments.filter((assignment) => {
    const tone = statusTone[assignment.status]
    return tone === 'orange' || tone === 'red'
  }).length
  const conflictCount = dateAssignments.filter((assignment) => assignment.status === 'Conflict').length
  const unassignedCount = dateAssignments.filter((assignment) => !assignment.vehicleId || !assignment.inspectorId).length
  const assignedVehicleIds = useMemo(
    () => new Set(dateAssignments.filter((assignment) => assignment.vehicleId).map((assignment) => assignment.vehicleId)),
    [dateAssignments],
  )
  const assignedInspectorIds = useMemo(
    () => new Set(dateAssignments.filter((assignment) => assignment.inspectorId).map((assignment) => assignment.inspectorId)),
    [dateAssignments],
  )
  const uncoveredShiftCount = dateAssignments.filter((assignment) => !assignment.inspectorId).length
  const coveragePercent = vehicleOptions.length ? Math.round((assignedVehicleIds.size / vehicleOptions.length) * 100) : 0
  const readyCount = dateAssignments.filter((assignment) => assignment.status === 'Confirmed' || assignment.status === 'In progress').length
  const readinessPercent = dateAssignments.length ? Math.round((readyCount / dateAssignments.length) * 100) : 0
  const nextDispatch = new Date(now)
  nextDispatch.setMinutes(0, 0, 0)
  nextDispatch.setHours(nextDispatch.getHours() + 1)
  const nextDispatchLabel = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(nextDispatch)

  const exceptionItems = useMemo(() => {
    const items = []
    dateAssignments.forEach((assignment) => {
      const routeNumber = findRouteNumber(routeOptions, assignment.routeId) || assignment.routeId
      if (!assignment.inspectorId) {
        items.push({
          key: `${assignment.id}-inspector`,
          icon: <PersonOffOutlinedIcon />,
          tone: 'orange',
          title: 'Inspector cover needed',
          detail: `${routeNumber} · starts ${formatDbTime(assignment.startTime)}`,
        })
      }
      if (assignment.status === 'Conflict') {
        const vehicleNumber = findVehicleNumber(vehicleOptions, assignment.vehicleId) || 'Vehicle'
        items.push({
          key: `${assignment.id}-conflict`,
          icon: <DirectionsBusFilledOutlinedIcon />,
          tone: 'red',
          title: 'Vehicle double-booked',
          detail: `${vehicleNumber} · ${formatDbTime(assignment.startTime)}-${formatDbTime(assignment.endTime)}`,
        })
      }
      if (!assignment.vehicleId) {
        items.push({
          key: `${assignment.id}-vehicle`,
          icon: <HelpOutlineOutlinedIcon />,
          tone: 'grey',
          title: 'Vehicle not assigned',
          detail: `${routeNumber} · starts ${formatDbTime(assignment.startTime)}`,
          chevron: true,
        })
      }
    })
    return items
  }, [dateAssignments, routeOptions, vehicleOptions])

  const filteredAssignments = useMemo(
    () =>
      dateAssignments.filter((assignment) => {
        const routeLabel = findName(routeOptions, assignment.routeId)
        const vehicleLabel = findName(vehicleOptions, assignment.vehicleId)
        const vehicleNumber = findVehicleNumber(vehicleOptions, assignment.vehicleId)
        const inspectorLabel = findName(inspectorOptions, assignment.inspectorId)
        const matchesSearch = `${assignment.routeId} ${routeLabel} ${vehicleNumber} ${vehicleLabel} ${inspectorLabel}`
          .toLowerCase()
          .includes(search.toLowerCase())
        const matchesRoute = routeFilter === 'All routes' || assignment.routeId === routeFilter
        const matchesStatus = statusFilter === 'All status' || assignment.status === statusFilter
        const tone = statusTone[assignment.status]
        const matchesTab =
          activeTab === 'all' ||
          (activeTab === 'confirmed' && assignment.status === 'Confirmed') ||
          (activeTab === 'attention' && (tone === 'orange' || tone === 'red'))
        return matchesSearch && matchesRoute && matchesStatus && matchesTab
      }),
    [dateAssignments, routeOptions, vehicleOptions, inspectorOptions, search, routeFilter, statusFilter, activeTab],
  )

  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const paginatedAssignments = filteredAssignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function openAdd() {
    setDraft(emptyDraft)
    setError('')
    setDialog('add')
  }
  function openEdit(assignment) {
    setDraft({
      ...assignment,
      date: String(assignment.date || '').slice(0, 10),
      startTime: formatDbTime(assignment.startTime),
      endTime: formatDbTime(assignment.endTime),
    })
    setError('')
    setDialog('edit')
  }
  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }))
  }
  async function saveAssignment(event) {
    event.preventDefault()
    if (!draft.date || !draft.startTime || !draft.endTime || !draft.routeId || !draft.vehicleId || !draft.inspectorId || !draft.status) {
      setError('Date, start/end time, route, vehicle, inspector, and status are required.')
      return
    }
    const payload = {
      date: draft.date,
      startTime: draft.startTime,
      endTime: draft.endTime,
      routeId: draft.routeId,
      vehicleId: draft.vehicleId,
      inspectorId: draft.inspectorId,
      status: draft.status,
    }
    try {
      await dispatch(dialog === 'edit' ? updateSchedule({ ...payload, id: draft.id }) : createSchedule(payload)).unwrap()
      setDialog(null)
    } catch (saveError) {
      setError(saveError)
    }
  }
  function requestDelete(assignment) {
    setPendingDelete(assignment)
  }
  async function confirmDelete() {
    if (!pendingDelete) return
    try {
      await dispatch(deleteSchedule(pendingDelete.id)).unwrap()
      setPendingDelete(null)
    } catch {
      // The Redux delete error is rendered in the confirmation dialog.
    }
  }

  return (
    <div className="service-page trip-assignment-page">
      <header className="service-topbar">
        <div className="service-date-status">
          <span>
            <i /> LIVE FLEET
          </span>
          <small>{currentDate} · {servicePeriod} service</small>
        </div>
        <span className="manager-support">Manager support</span>
        <IconButton className="service-notification" aria-label="Notifications">
          <NotificationsNoneOutlinedIcon />
          <i />
        </IconButton>
      </header>
      <main className="service-content">
        <p className="trip-breadcrumb">SCHEDULE MANAGEMENT <ChevronRightIcon fontSize="inherit" /> TRIP ASSIGNMENT</p>
        <div className="service-heading">
          <div>
            <h1>Trip assignment</h1>
          </div>
          <div className="trip-heading-controls">
            <div className="trip-date-nav">
              <IconButton aria-label="Previous day" onClick={() => shiftSelectedDate(-1)}><ChevronLeftOutlinedIcon /></IconButton>
              <span>{selectedDateLabel}</span>
              <IconButton aria-label="Next day" onClick={() => shiftSelectedDate(1)}><ChevronRightOutlinedIcon /></IconButton>
            </div>
            <button className="add-service" type="button" onClick={openAdd}>
              <AddOutlinedIcon fontSize="small" /> Add trip assignment
            </button>
          </div>
        </div>
        <section className="service-kpi-grid">
          <Kpi icon={<EventAvailableOutlinedIcon />} label="Trips scheduled" value={dateAssignments.length} detail={`${confirmedCount} confirmed · ${pendingCount} pending`} />
          <Kpi icon={<DirectionsBusOutlinedIcon />} label="Fleet coverage" value={`${coveragePercent}%`} detail={`${assignedVehicleIds.size} of ${vehicleOptions.length} vehicles assigned`} />
          <Kpi icon={<ShieldOutlinedIcon />} label="Inspectors assigned" value={assignedInspectorIds.size} detail={`${uncoveredShiftCount} shifts still uncovered`} />
          <Kpi icon={<WarningAmberOutlinedIcon />} label="Attention required" value={needsAttentionCount} detail={`${conflictCount} conflicts · ${unassignedCount} unassigned`} tone="review" />
        </section>
        <div className="trip-layout">
          <section className="services-table-panel trip-list-panel">
            <div className="panel-title-row trip-panel-title-row">
              <div>
                <h2>Trip assignments</h2>
                <p>Daily operating plan · Last synced {nowTimeLabel}</p>
              </div>
            </div>
            {loadStatus === 'failed' && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => dispatch(fetchSchedules())}>Retry</Button>}>{loadError}</Alert>}
            <div className="service-table-tools">
              <TextField
                placeholder="Search route, vehicle or inspector"
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1) }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchOutlinedIcon />
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <select aria-label="Filter by route" value={routeFilter} onChange={(event) => { setRouteFilter(event.target.value); setPage(1) }}>
                <option>All routes</option>
                {routeOptions.map((route) => <option key={route.id} value={route.id}>{route.routeNumber}</option>)}
              </select>
              <select aria-label="Filter by status" value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1) }}>
                <option>All status</option>
                {statusOptions.map((status) => <option key={status}>{status}</option>)}
              </select>
              <IconButton aria-label="More filters">
                <FilterListOutlinedIcon />
              </IconButton>
            </div>
            <div className="vehicle-tabs">
              <button className={activeTab === 'all' ? 'selected-tab' : ''} type="button" onClick={() => { setActiveTab('all'); setPage(1) }}>
                All assignments · {dateAssignments.length}
              </button>
              <button className={activeTab === 'confirmed' ? 'selected-tab' : ''} type="button" onClick={() => { setActiveTab('confirmed'); setPage(1) }}>
                Confirmed · {confirmedCount}
              </button>
              <button className={activeTab === 'attention' ? 'selected-tab' : ''} type="button" onClick={() => { setActiveTab('attention'); setPage(1) }}>
                Needs attention · {needsAttentionCount}
              </button>
            </div>
            <div className="service-table-wrap">
              <table className="service-table trip-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>START TIME</th>
                    <th>END TIME</th>
                    <th>ROUTE</th>
                    <th>VEHICLE</th>
                    <th>INSPECTOR</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {loadStatus === 'loading' && <tr><td className="vehicle-empty-state" colSpan="8">Loading trip assignments…</td></tr>}
                  {loadStatus !== 'loading' && paginatedAssignments.map((assignment) => (
                    <tr key={assignment.id}>
                      <td>{formatDisplayDate(assignment.date)}</td>
                      <td>{formatDbTime(assignment.startTime)}</td>
                      <td>{formatDbTime(assignment.endTime)}</td>
                      <th>
                        <b>{findRouteNumber(routeOptions, assignment.routeId)}</b>
                        <small>{findName(routeOptions, assignment.routeId)}</small>
                      </th>
                      <th>
                        <b>{findVehicleNumber(vehicleOptions, assignment.vehicleId) || '—'}</b>
                        <small>{findName(vehicleOptions, assignment.vehicleId) || 'Vehicle required'}</small>
                      </th>
                      <td>{findName(inspectorOptions, assignment.inspectorId) || 'Unassigned'}</td>
                      <td>
                        <span className={`service-status status-${statusTone[assignment.status]}`}>
                          <i />
                          {assignment.status}
                        </span>
                      </td>
                      <td className="vehicle-actions">
                        <IconButton aria-label={`Edit ${assignment.routeId}`} onClick={() => openEdit(assignment)}>
                          <EditOutlinedIcon />
                        </IconButton>
                        <IconButton aria-label={`Delete ${assignment.routeId}`} onClick={() => requestDelete(assignment)}>
                          <DeleteOutlineOutlinedIcon />
                        </IconButton>
                      </td>
                    </tr>
                  ))}
                  {!filteredAssignments.length && (
                    <tr>
                      <td className="vehicle-empty-state" colSpan="8">No matching assignments</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="vehicle-pagination">
              <span>{filteredAssignments.length ? `Showing ${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filteredAssignments.length)} of ${filteredAssignments.length} assignments` : 'Showing 0 assignments'}</span>
              <div>
                <IconButton aria-label="Previous page" disabled={currentPage === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  <ChevronLeftOutlinedIcon />
                </IconButton>
                <b>{currentPage}</b>
                <span>of {pageCount}</span>
                <IconButton aria-label="Next page" disabled={currentPage === pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}>
                  <ChevronRightOutlinedIcon />
                </IconButton>
              </div>
            </div>
          </section>
          <aside className="trip-side-rail">
            <section className="trip-coverage-card">
              <div className="trip-coverage-head">
                <h3>Assignment coverage</h3>
                <span className="trip-live-badge"><i /> LIVE</span>
              </div>
              <span className="trip-coverage-time">{nowTimeLabel}</span>
              <AssignmentCoverageChart />
              <div className="trip-coverage-stats">
                <div><strong>{coveragePercent}%</strong><span>Fleet covered</span></div>
                <div><strong>{confirmedCount}</strong><span>Confirmed</span></div>
                <div><strong>{String(needsAttentionCount).padStart(2, '0')}</strong><span>Open issues</span></div>
              </div>
            </section>
            <section className="trip-exceptions-card">
              <div className="trip-exceptions-head">
                <div>
                  <h3>Assignment exceptions</h3>
                  <p>Resolve before dispatch</p>
                </div>
                <span className="trip-open-badge">{exceptionItems.length} open</span>
              </div>
              <ul className="trip-exceptions-list">
                {exceptionItems.slice(0, 5).map((exception) => (
                  <li key={exception.key}>
                    <span className={`trip-exception-icon tone-${exception.tone}`}>{exception.icon}</span>
                    <span className="trip-exception-copy">
                      <b>{exception.title}</b>
                      <small>{exception.detail}</small>
                    </span>
                    {exception.chevron && <ChevronRightIcon fontSize="small" className="trip-exception-chevron" />}
                  </li>
                ))}
                {!exceptionItems.length && (
                  <li>
                    <span className="trip-exception-copy"><small>No exceptions for this day.</small></span>
                  </li>
                )}
              </ul>
              <div className="trip-exceptions-footer">
                <span><i /> No critical cancellations</span>
                <button type="button">Review all <ChevronRightIcon fontSize="inherit" /></button>
              </div>
            </section>
            <section className="trip-readiness-card">
              <div className="trip-readiness-head">
                <h3>Shift readiness</h3>
                <span className="trip-next-badge">NEXT 2 HOURS</span>
              </div>
              <p>Trips ready for dispatch</p>
              <strong className="trip-readiness-value">{readyCount} / {dateAssignments.length}</strong>
              <div className="trip-readiness-bar"><span style={{ width: `${readinessPercent}%` }} /></div>
              <div className="trip-readiness-footer">
                <ScheduleOutlinedIcon fontSize="small" /> Next dispatch check at {nextDispatchLabel}
              </div>
            </section>
          </aside>
        </div>
      </main>
      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <form onSubmit={saveAssignment}>
          <DialogTitle>{dialog === 'edit' ? 'Update trip assignment' : 'Add trip assignment'}</DialogTitle>
          <DialogContent className="vehicle-form-fields">
            <TextField
              label="Date"
              type="date"
              value={draft.date}
              onChange={(event) => updateDraft('date', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="Start time"
              type="time"
              value={draft.startTime}
              onChange={(event) => updateDraft('startTime', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label="End time"
              type="time"
              value={draft.endTime}
              onChange={(event) => updateDraft('endTime', event.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField select label="Route" value={draft.routeId} onChange={(event) => updateDraft('routeId', event.target.value)}>
              {routeOptions.map((route) => (
                <MenuItem key={route.id} value={route.id}>{route.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Vehicle" value={draft.vehicleId} onChange={(event) => updateDraft('vehicleId', event.target.value)}>
              {vehicleOptions.map((vehicle) => (
                <MenuItem key={vehicle.id} value={vehicle.id}>{vehicle.vehicleNumber} · {vehicle.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Inspector" value={draft.inspectorId} onChange={(event) => updateDraft('inspectorId', event.target.value)}>
              {inspectorOptions.map((inspector) => (
                <MenuItem key={inspector.id} value={inspector.id}>{inspector.id} · {inspector.name}</MenuItem>
              ))}
            </TextField>
            <TextField select label="Status" value={draft.status} onChange={(event) => updateDraft('status', event.target.value)}>
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </TextField>
            {error && <p className="vehicle-form-error">{error}</p>}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createStatus === 'loading' || updateStatus === 'loading'}>
              {createStatus === 'loading' || updateStatus === 'loading' ? 'Saving...' : dialog === 'edit' ? 'Save changes' : 'Add trip assignment'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} maxWidth="xs" fullWidth>
        <DialogTitle className="vehicle-delete-title"><span className="vehicle-delete-icon"><DeleteOutlineOutlinedIcon /></span>Remove trip assignment?</DialogTitle>
        <DialogContent className="vehicle-delete-content">
          <p>This trip assignment will be removed from the schedule.</p>
          {pendingDelete && (
            <div className="vehicle-delete-summary">
              <strong>{findName(routeOptions, pendingDelete.routeId) || pendingDelete.routeId}</strong>
              <span>{pendingDelete.startTime} - {pendingDelete.endTime}</span>
              <small>{formatDisplayDate(pendingDelete.date)}</small>
            </div>
          )}
        </DialogContent>
        {deleteError && <p className="vehicle-delete-error">{deleteError}</p>}
        <DialogActions className="vehicle-delete-actions">
          <Button onClick={() => setPendingDelete(null)} disabled={deleteStatus === 'loading'}>Cancel</Button>
          <Button className="vehicle-confirm-delete" variant="contained" onClick={confirmDelete} disabled={deleteStatus === 'loading'} startIcon={<DeleteOutlineOutlinedIcon />}>
            {deleteStatus === 'loading' ? 'Removing...' : 'Remove assignment'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

function Kpi({ icon, label, value, detail, tone }) {
  return (
    <article className="service-kpi">
      <div className="service-kpi-head">
        <span className="service-kpi-icon">{icon}</span>
        <span>{label}</span>
        <b className={tone === 'review' ? 'kpi-badge-review' : ''}>
          <i /> {tone === 'review' ? 'REVIEW' : 'LIVE'}
        </b>
      </div>
      <strong>{value}</strong>
      {detail && <small>{detail}</small>}
    </article>
  )
}

export default TripAssignmentView
