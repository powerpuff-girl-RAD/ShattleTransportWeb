import { useEffect, useState } from 'react'
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
  TextField,
} from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import AnalyticsOutlinedIcon from '@mui/icons-material/AnalyticsOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import {
  clearRouteCreateError,
  clearRouteUpdateError,
  clearRouteStatusError,
  createRoute,
  fetchRoutes,
  updateRoute,
  updateRouteStatus,
} from '../controllers/routeController'
import './Routes.css'

const createEmptyStop = (stopOrder = 1) => ({ stopName: '', stopOrder, distanceFromStartKm: '' })
const emptyRoute = {
  routeNumber: '',
  routeName: '',
  startLocation: '',
  endLocation: '',
  distanceKm: '',
  stops: [createEmptyStop()],
}

function validateRouteDraft(routeDraft, routes, editingRouteId) {
  const errors = {}
  const routeNumber = routeDraft.routeNumber.trim()
  const distanceKm = Number(routeDraft.distanceKm)
  const duplicateRouteNumber = routes.some((route) => (
    route.id !== editingRouteId &&
    (route.routeNumber || route.id).trim().toLowerCase() === routeNumber.toLowerCase()
  ))

  if (!routeNumber) errors.routeNumber = 'Route number is required.'
  else if (duplicateRouteNumber) errors.routeNumber = 'This route number is already in use.'
  if (routeDraft.routeName.trim().length < 2) errors.routeName = 'Enter a route name with at least 2 characters.'
  if (!routeDraft.startLocation.trim()) errors.startLocation = 'Start location is required.'
  if (!routeDraft.endLocation.trim()) errors.endLocation = 'End location is required.'
  if (!routeDraft.distanceKm.trim() || !Number.isFinite(distanceKm) || distanceKm <= 0) errors.distanceKm = 'Distance must be greater than 0 km.'

  const stopOrderCounts = new Map()
  routeDraft.stops.forEach((stop) => {
    const order = Number(stop.stopOrder)
    if (Number.isInteger(order) && order > 0) stopOrderCounts.set(order, (stopOrderCounts.get(order) || 0) + 1)
  })

  const stops = routeDraft.stops.map((stop) => {
    const stopErrors = {}
    const order = Number(stop.stopOrder)
    const stopDistance = Number(stop.distanceFromStartKm)
    if (!stop.stopName.trim()) stopErrors.stopName = 'Stop name is required.'
    if (!Number.isInteger(order) || order < 1) stopErrors.stopOrder = 'Order must be a positive whole number.'
    else if (stopOrderCounts.get(order) > 1) stopErrors.stopOrder = 'Stop order must be unique.'
    if (!String(stop.distanceFromStartKm).trim() || !Number.isFinite(stopDistance) || stopDistance < 0) stopErrors.distanceFromStartKm = 'Enter a distance of 0 km or more.'
    else if (Number.isFinite(distanceKm) && stopDistance > distanceKm) stopErrors.distanceFromStartKm = 'Stop distance cannot exceed route distance.'
    return stopErrors
  })

  const orderedStops = routeDraft.stops
    .map((stop, index) => ({ order: Number(stop.stopOrder), distance: Number(stop.distanceFromStartKm), index }))
    .sort((first, second) => first.order - second.order)
  orderedStops.forEach((stop, index) => {
    if (index > 0 && stop.distance < orderedStops[index - 1].distance) {
      stops[stop.index].distanceFromStartKm = 'Distance must not decrease as stop order increases.'
    }
  })

  if (!routeDraft.stops.length) errors.stops = 'Add at least one route stop.'
  else if (stops.some((stop) => Object.keys(stop).length > 0)) errors.stops = stops
  return errors
}

function RouteMetric({ label, value, accent = false }) {
  return (
    <div className={`route-metric${accent ? ' metric-accent' : ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function RouteCard({ route, selected, statusPending, onSelect, onEdit, onAnalytics, onToggleActive }) {
  function handleKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(route.id)
    }
  }

  function stopCardClick(event) {
    event.stopPropagation()
  }

  return (
    <article
      className={`route-card${selected ? ' route-card-selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-expanded={selected}
      onClick={() => onSelect(route.id)}
      onKeyDown={handleKeyDown}
    >
      <div className="route-card-heading">
        <span className={`route-code${selected ? ' route-code-selected' : ''}`}>{route.routeNumber || route.id}</span>
        <h2>{route.name}</h2>
        <span className={`route-status ${route.active ? 'route-status-active' : 'route-status-inactive'}`}>{route.active ? 'ACTIVE' : 'INACTIVE'}</span>
      </div>
      <div className="route-metrics">
        <RouteMetric label="STOPS" value={`${route.stops} Stops`} />
        <RouteMetric label="DISTANCE" value={route.distance} />
        <RouteMetric label="DAILY PASSENGERS" value={route.passengers} />
        <RouteMetric label="REVENUE" value={route.revenue} accent />
      </div>

      {selected ? (
        <div className="route-expanded-content" onClick={stopCardClick}>
          <div className="route-expanded-title">Route Path &amp; Stops Timeline</div>
          <div className="route-timeline" aria-label={`${route.routeNumber || route.id} stops`}>
            {route.timeline.map((stop, index) => (
              <div className={`route-stop${index === 0 || index === route.timeline.length - 1 ? ' route-stop-terminal' : ''}`} key={`${stop}-${index}`}>
                <span className="route-stop-dot" />
                <span>{stop}</span>
              </div>
            ))}
          </div>
          <div className="route-actions">
            <Button variant="contained" startIcon={<EditOutlinedIcon />} onClick={() => onEdit(route)}>Edit Route</Button>
            <Button variant="outlined" startIcon={<AnalyticsOutlinedIcon />} onClick={() => onAnalytics(route)}>View Analytics</Button>
            <Button className={route.active ? 'route-deactivate' : 'route-activate'} variant="outlined" disabled={statusPending} onClick={() => onToggleActive(route)}>{statusPending ? 'Saving…' : route.active ? 'Deactivate' : 'Activate'}</Button>
          </div>
        </div>
      ) : (
        <p className="route-card-hint">Click card to expand route timeline and management tools.</p>
      )}
    </article>
  )
}

function RoutesView() {
  const dispatch = useDispatch()
  const { routes, loadStatus, loadError, createStatus, createError, updateStatus, updateError, statusUpdateId, statusUpdateError } = useSelector((state) => state.routes)
  const [search, setSearch] = useState('')
  const [selectedRouteId, setSelectedRouteId] = useState('')
  const [dialog, setDialog] = useState('')
  const [editingRouteId, setEditingRouteId] = useState(null)
  const [analyticsRoute, setAnalyticsRoute] = useState(null)
  const [routeDraft, setRouteDraft] = useState(emptyRoute)
  const [showRouteValidation, setShowRouteValidation] = useState(false)
  const routeErrors = showRouteValidation ? validateRouteDraft(routeDraft, routes, editingRouteId) : {}
  const selectedRoute = routes.some((route) => route.id === selectedRouteId) ? selectedRouteId : routes[0]?.id

  useEffect(() => {
    if (loadStatus === 'idle') dispatch(fetchRoutes())
  }, [dispatch, loadStatus])

  const filteredRoutes = routes.filter((route) => `${route.id} ${route.name}`.toLowerCase().includes(search.trim().toLowerCase()))

  function openAddRoute() {
    setEditingRouteId(null)
    setRouteDraft(emptyRoute)
    setShowRouteValidation(false)
    dispatch(clearRouteCreateError())
    setDialog('route')
  }

  function openEditRoute(route) {
    setEditingRouteId(route.id)
    setShowRouteValidation(false)
    dispatch(clearRouteUpdateError())
    setRouteDraft({
      routeNumber: route.routeNumber || route.id,
      routeName: route.name,
      startLocation: route.startLocation || route.timeline[0] || '',
      endLocation: route.endLocation || route.timeline.at(-1) || '',
      distanceKm: route.distance.replace(' km', ''),
      stops: route.stopDetails || route.timeline.map((stopName, index, stops) => ({
        stopName,
        stopOrder: index + 1,
        distanceFromStartKm: index === stops.length - 1
          ? Number(route.distance.replace(' km', ''))
          : Number((Number(route.distance.replace(' km', '')) * index / (stops.length - 1 || 1)).toFixed(1)),
      })),
    })
    setDialog('route')
  }

  async function saveRoute(event) {
    event.preventDefault()
    setShowRouteValidation(true)
    const validationErrors = validateRouteDraft(routeDraft, routes, editingRouteId)
    if (Object.keys(validationErrors).length > 0) return

    const routeNumber = routeDraft.routeNumber.trim()
    const stopDetails = routeDraft.stops
      .map((stop, index) => ({
        stopName: stop.stopName.trim(),
        stopOrder: Number(stop.stopOrder) || index + 1,
        distanceFromStartKm: Number(stop.distanceFromStartKm),
      }))
      .sort((first, second) => first.stopOrder - second.stopOrder)
    const updatedRoute = {
      id: editingRouteId || routeNumber,
      routeNumber,
      name: routeDraft.routeName.trim(),
      routeName: routeDraft.routeName.trim(),
      startLocation: routeDraft.startLocation.trim(),
      endLocation: routeDraft.endLocation.trim(),
      stops: stopDetails.length,
      stopDetails,
      distanceKm: Number(routeDraft.distanceKm),
      distance: `${routeDraft.distanceKm} km`,
      passengers: editingRouteId ? routes.find((route) => route.id === editingRouteId)?.passengers || '0' : '0',
      revenue: editingRouteId ? routes.find((route) => route.id === editingRouteId)?.revenue || 'LKR 0.00M' : 'LKR 0.00M',
      timeline: [routeDraft.startLocation.trim(), ...stopDetails.map((stop) => stop.stopName), routeDraft.endLocation.trim()],
      active: editingRouteId ? routes.find((route) => route.id === editingRouteId)?.active ?? true : true,
    }

    if (editingRouteId) {
      try {
        const savedRoute = await dispatch(updateRoute({ ...updatedRoute, stops: stopDetails })).unwrap()
        setSelectedRouteId(savedRoute.id)
      } catch {
        return
      }
    } else {
      try {
        const createdRoute = await dispatch(createRoute({
          routeNumber,
          routeName: routeDraft.routeName.trim(),
          startLocation: routeDraft.startLocation.trim(),
          endLocation: routeDraft.endLocation.trim(),
          distanceKm: routeDraft.distanceKm,
          stops: stopDetails,
        })).unwrap()
        setSelectedRouteId(createdRoute.id)
      } catch {
        return
      }
    }
    closeRouteDialog()
  }

  function closeRouteDialog() {
    setDialog('')
    setShowRouteValidation(false)
  }

  function updateRouteDraft(field, value) {
    setRouteDraft((current) => ({ ...current, [field]: value }))
  }

  function updateStop(index, field, value) {
    setRouteDraft((current) => ({
      ...current,
      stops: current.stops.map((stop, stopIndex) => stopIndex === index ? { ...stop, [field]: value } : stop),
    }))
  }

  function addStop() {
    setRouteDraft((current) => ({ ...current, stops: [...current.stops, createEmptyStop(current.stops.length + 1)] }))
  }

  function removeStop(index) {
    setRouteDraft((current) => ({
      ...current,
      stops: current.stops
        .filter((_, stopIndex) => stopIndex !== index)
        .map((stop, stopIndex) => ({ ...stop, stopOrder: stopIndex + 1 })),
    }))
  }

  function toggleActive(route) {
    dispatch(clearRouteStatusError())
    dispatch(updateRouteStatus({ id: route.id, status: !route.active }))
  }

  return (
    <div className="routes-page">
      <header className="routes-topbar">
        <h1>Shattle Transport Manager - Route Management</h1>
        <span className="routes-system-live"><i /> SYSTEM LIVE</span>
        <div className="routes-global-search"><SearchOutlinedIcon /><span>Search routes, buses...</span></div>
        <IconButton aria-label="Notifications" className="routes-notifications"><NotificationsNoneOutlinedIcon /><i /></IconButton>
      </header>

      <div className="routes-toolbar">
        <TextField
          className="routes-search-field"
          size="small"
          placeholder="Search route names, numbers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          slotProps={{
            htmlInput: { 'aria-label': 'Search route names or numbers' },
            input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> },
          }}
        />
        <Button variant="contained" startIcon={<AddOutlinedIcon />} onClick={openAddRoute}>Add New Route</Button>
      </div>

      <main className="routes-content">
        {loadStatus === 'failed' && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => dispatch(fetchRoutes())}>Retry</Button>}>{loadError}</Alert>}
        {statusUpdateError && <Alert severity="error">{statusUpdateError}</Alert>}
        {loadStatus === 'loading' ? <div className="routes-empty-state">Loading routes…</div> : filteredRoutes.length ? (
          <div className="routes-grid">
            {filteredRoutes.map((route) => (
              <RouteCard
                key={route.id}
                route={route}
                selected={selectedRoute === route.id}
                statusPending={statusUpdateId === route.id}
                onSelect={setSelectedRouteId}
                onEdit={openEditRoute}
                onAnalytics={setAnalyticsRoute}
                onToggleActive={toggleActive}
              />
            ))}
          </div>
        ) : loadStatus === 'succeeded' ? <div className="routes-empty-state"><FmdGoodOutlinedIcon /><p>No routes match your search.</p></div> : null}
      </main>

      <Dialog open={dialog === 'route'} onClose={closeRouteDialog} fullWidth maxWidth="sm">
        <form onSubmit={saveRoute} noValidate>
          <DialogTitle>{editingRouteId ? 'Edit route' : 'Add new route'}</DialogTitle>
          <DialogContent className="route-form-fields">
            <TextField label="Route Number" value={routeDraft.routeNumber} onChange={(event) => updateRouteDraft('routeNumber', event.target.value)} required error={Boolean(routeErrors.routeNumber)} helperText={routeErrors.routeNumber} fullWidth />
            <TextField label="Route Name" value={routeDraft.routeName} onChange={(event) => updateRouteDraft('routeName', event.target.value)} required error={Boolean(routeErrors.routeName)} helperText={routeErrors.routeName} fullWidth />
            <TextField label="Start Location" value={routeDraft.startLocation} onChange={(event) => updateRouteDraft('startLocation', event.target.value)} required error={Boolean(routeErrors.startLocation)} helperText={routeErrors.startLocation} fullWidth />
            <TextField label="End Location" value={routeDraft.endLocation} onChange={(event) => updateRouteDraft('endLocation', event.target.value)} required error={Boolean(routeErrors.endLocation)} helperText={routeErrors.endLocation} fullWidth />
            <TextField label="Distance (km)" type="number" slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }} value={routeDraft.distanceKm} onChange={(event) => updateRouteDraft('distanceKm', event.target.value)} required error={Boolean(routeErrors.distanceKm)} helperText={routeErrors.distanceKm} fullWidth />
            <section className="route-stops-editor" aria-label="Route stops">
              <div className="route-stops-editor-heading"><div><h3>Route Stops</h3><p>Add stops in travel order.</p></div><Button type="button" variant="outlined" startIcon={<AddOutlinedIcon />} onClick={addStop}>More Stop</Button></div>
              <div className="route-stop-form-list">
                {routeDraft.stops.map((stop, index) => (
                  <div className="route-stop-form-row" key={`stop-${index}`}>
                    <TextField label="Stop Name" value={stop.stopName} onChange={(event) => updateStop(index, 'stopName', event.target.value)} required error={Boolean(routeErrors.stops?.[index]?.stopName)} helperText={routeErrors.stops?.[index]?.stopName} fullWidth />
                    <TextField label="Stop Order" type="number" slotProps={{ htmlInput: { min: 1, step: 1 } }} value={stop.stopOrder} onChange={(event) => updateStop(index, 'stopOrder', event.target.value)} required error={Boolean(routeErrors.stops?.[index]?.stopOrder)} helperText={routeErrors.stops?.[index]?.stopOrder} fullWidth />
                    <TextField label="Distance From Start (km)" type="number" slotProps={{ htmlInput: { min: 0, step: 0.1 } }} value={stop.distanceFromStartKm} onChange={(event) => updateStop(index, 'distanceFromStartKm', event.target.value)} required error={Boolean(routeErrors.stops?.[index]?.distanceFromStartKm)} helperText={routeErrors.stops?.[index]?.distanceFromStartKm} fullWidth />
                    <IconButton type="button" className="remove-route-stop" aria-label={`Remove stop ${index + 1}`} onClick={() => removeStop(index)} disabled={routeDraft.stops.length === 1}><DeleteOutlineOutlinedIcon /></IconButton>
                  </div>
                ))}
              </div>
            </section>
            {!editingRouteId && createError && <div className="route-create-error">{createError}</div>}
            {editingRouteId && updateError && <div className="route-create-error">{updateError}</div>}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeRouteDialog} disabled={updateStatus === 'loading' || createStatus === 'loading'}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={editingRouteId ? updateStatus === 'loading' : createStatus === 'loading'}>
              {editingRouteId ? (updateStatus === 'loading' ? 'Saving…' : 'Save route') : (createStatus === 'loading' ? 'Saving…' : 'Add route')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={Boolean(analyticsRoute)} onClose={() => setAnalyticsRoute(null)} fullWidth maxWidth="xs">
        <DialogTitle>{analyticsRoute?.id} Route Analytics</DialogTitle>
        <DialogContent className="route-analytics-content">
          <strong>{analyticsRoute?.name}</strong>
          <div><span>Daily passengers</span><b>{analyticsRoute?.passengers}</b></div>
          <div><span>Route distance</span><b>{analyticsRoute?.distance}</b></div>
          <div><span>Daily revenue</span><b>{analyticsRoute?.revenue}</b></div>
        </DialogContent>
        <DialogActions><Button onClick={() => setAnalyticsRoute(null)}>Close</Button></DialogActions>
      </Dialog>
    </div>
  )
}

export default RoutesView
