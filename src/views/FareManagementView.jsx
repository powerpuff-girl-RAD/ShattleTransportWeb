import { useEffect, useRef, useState } from 'react'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import { useDispatch, useSelector } from 'react-redux'
import { Alert, Button, CircularProgress, IconButton, InputAdornment, Menu, MenuItem, TextField } from '@mui/material'
import { fetchRoutes } from '../controllers/routeController'
import { getFareConfig, updateFareConfig } from '../services/fareService'
import './FareManagement.css'

const passNames = ['Daily Pass', 'Weekly Pass', 'Monthly Pass']

function unwrap(value) {
  let result = value
  for (let depth = 0; depth < 3 && result && !Array.isArray(result); depth += 1) {
    if (result.data !== undefined) result = result.data
    else if (result.result !== undefined) result = result.result
    else break
  }
  return result || {}
}

function read(source, ...keys) {
  for (const key of keys) if (source?.[key] !== undefined && source[key] !== null) return source[key]
  return undefined
}

function getPasses(config) {
  const source = read(config, 'passes', 'standardPasses', 'passPrices', 'Passes', 'farePass', 'farePasses', 'FarePass') || {}
  if (Array.isArray(source)) {
    return source.map((item, index) => {
      const isOn = read(item, 'IsOn', 'isOn')
      const status = read(item, 'status', 'Status') ?? (isOn === undefined || isOn === null || isOn === true || isOn === 1 || isOn === '1' || String(isOn).toLowerCase() === 'true' ? 'Active' : 'Paused')
      return {
        id: read(item, 'id', 'farePassId', 'Id'),
        name: String(read(item, 'PassProduct', 'passProduct', 'name', 'passName', 'type', 'Type') ?? passNames[index] ?? `Pass ${index + 1}`),
        tagline: String(read(item, 'Tagline', 'tagline') ?? ''),
        price: Number(read(item, 'price', 'fare', 'amount', 'Price') ?? 0),
        validity: String(read(item, 'validity', 'Validity') ?? ''),
        usage: String(read(item, 'UsageCondition', 'usageCondition', 'usage', 'Usage') ?? ''),
        status: String(status),
      }
    })
  }
  return [
    { name: passNames[0], price: Number(read(source, 'daily', 'dailyPass', 'dailyPrice', 'DailyPass') ?? 0) },
    { name: passNames[1], price: Number(read(source, 'weekly', 'weeklyPass', 'weeklyPrice', 'WeeklyPass') ?? 0) },
    { name: passNames[2], price: Number(read(source, 'monthly', 'monthlyPass', 'monthlyPrice', 'MonthlyPass') ?? 0) },
  ]
}

function normalizeCommon(value) {
  const config = unwrap(value)
  const peaks = read(config, 'peakHours', 'peakHourConfiguration', 'PeakHours') || {}
  const visitor = read(config, 'visitorPass', 'visitorArrangement', 'VisitorPass') || {}
  const flatFares = read(config, 'flatFares', 'flatFare', 'FlatFares') || []
  const distanceFare = read(config, 'distanceFare', 'DistanceFare', 'distanceFares', 'DistanceFares') || []
  const timeFares = read(config, 'timeBasedFare', 'timeBasedFares', 'timeFares', 'timeBands', 'TimeBasedFares')
  const passProducts = read(config, 'passes', 'standardPasses', 'passPrices', 'Passes', 'farePass', 'farePasses', 'FarePass') || {}
  const sourcePasses = Array.isArray(passProducts) ? passProducts : []
  const hasFarePassRows = read(config, 'farePass', 'farePasses', 'FarePass') !== undefined || sourcePasses.some((item) => read(item, 'PassProduct', 'passProduct') !== undefined)
  const passes = getPasses(config).map((pass, index) => {
    const source = sourcePasses.find((item) => String(read(item, 'PassProduct', 'passProduct', 'name', 'passName', 'type', 'Type')).toLowerCase() === pass.name.toLowerCase()) || sourcePasses[index] || {}
    const isOn = read(source, 'IsOn', 'isOn')
    const defaultStatus = isOn === undefined || isOn === null || isOn === true || isOn === 1 || isOn === '1' || String(isOn).toLowerCase() === 'true' ? 'Active' : 'Paused'
    return {
      ...pass,
      tagline: String(read(source, 'Tagline', 'tagline') ?? pass.tagline ?? ''),
      validity: String(read(source, 'validity', 'duration', 'validFor', 'Validity') ?? (index === 0 ? '1 service day' : index === 1 ? '7 days' : '30 days')),
      usage: String(read(source, 'UsageCondition', 'usageCondition', 'usage', 'coverage', 'Usage') ?? (index === 0 ? 'Local routes' : index === 1 ? 'Local + Express' : 'All routes')),
      status: String(read(source, 'status', 'Status') ?? pass.status ?? defaultStatus),
      isVisitorConfig: false,
    }
  })
  if (!hasFarePassRows) {
    passes.push({
      isVisitorConfig: true,
      name: String(read(visitor, 'name', 'passName', 'Name') ?? 'Visitor Pass'),
      tagline: 'Registered visitors',
      price: Number(read(visitor, 'price', 'amount', 'dailyRate', 'DailyRate') ?? 0),
      validity: `${Number(read(visitor, 'maximumDurationDays', 'maxDurationDays', 'maxDays', 'MaximumDurationDays') ?? 7)} days`,
      usage: String(read(visitor, 'usage', 'coverage', 'Usage') ?? 'Airport + City'),
      status: String(read(visitor, 'status', 'Status') ?? 'Active'),
    })
  }
  const normalizedTimeFares = Array.isArray(timeFares) ? timeFares.map((item, index) => ({
    id: String(read(item, 'id', 'fareId', 'Id') ?? index),
    period: String(read(item, 'period', 'name', 'label', 'Period') ?? `Period ${index + 1}`),
    window: String(read(item, 'window', 'timeWindow', 'schedule', 'Window') ?? ''),
    applies: String(read(item, 'applies', 'days', 'applicableDays', 'Applies') ?? 'ALL DAYS'),
    rule: String(read(item, 'fareRule', 'rule', 'multiplier', 'FareRule') ?? '1.00x'),
    status: String(read(item, 'status', 'Status') ?? 'Active'),
  })) : [
    { id: 'morning', period: 'Morning peak', window: `${String(read(peaks, 'morningStart', 'morningPeakStart') ?? '06:30')}–${String(read(peaks, 'morningEnd', 'morningPeakEnd') ?? '09:00')}`, applies: 'MON–FRI', rule: `${Number(read(peaks, 'multiplier', 'peakMultiplier') ?? 1.25).toFixed(2)}x`, status: 'Active' },
    { id: 'off-peak', period: 'Off-peak', window: '09:00–16:30', applies: 'MON–FRI', rule: '0.90x', status: 'Active' },
    { id: 'evening', period: 'Evening peak', window: `${String(read(peaks, 'eveningStart', 'eveningPeakStart') ?? '16:30')}–${String(read(peaks, 'eveningEnd', 'eveningPeakEnd') ?? '19:30')}`, applies: 'MON–FRI', rule: '1.20x', status: 'Active' },
    { id: 'night', period: 'Night service', window: '19:30–05:00', applies: 'ALL DAYS', rule: '+ LKR 40', status: 'Active' },
  ]
  return {
    source: config,
    passes,
    visitor: {
      price: Number(read(visitor, 'dailyRate', 'pricePerDay', 'price', 'DailyRate') ?? 0),
      maxDays: Number(read(visitor, 'maximumDurationDays', 'maxDurationDays', 'maxDays', 'MaximumDurationDays') ?? 7),
    },
    peak: {
      morningStart: String(read(peaks, 'morningStart', 'morningPeakStart', 'MorningStart') ?? '07:00'),
      morningEnd: String(read(peaks, 'morningEnd', 'morningPeakEnd', 'MorningEnd') ?? '09:00'),
      eveningStart: String(read(peaks, 'eveningStart', 'eveningPeakStart', 'EveningStart') ?? '17:00'),
      eveningEnd: String(read(peaks, 'eveningEnd', 'eveningPeakEnd', 'EveningEnd') ?? '19:00'),
      multiplier: Number(read(peaks, 'multiplier', 'peakMultiplier', 'Multiplier') ?? 1.5),
    },
    distanceFare: normalizeDistance(distanceFare),
    flatFares: Array.isArray(flatFares) ? flatFares.map((fare, index) => ({
      id: String(read(fare, 'id', 'fareId', 'Id') ?? index),
      label: String(read(fare, 'PassengerType', 'passengerType', 'name', 'fareName', 'label', 'Name') ?? `Fare ${index + 1}`),
      subtitle: String(read(fare, 'PassengerDescription', 'passengerDescription', 'subtitle', 'description', 'Subtitle') ?? ''),
      localFare: Number(read(fare, 'Local', 'localFare', 'localPrice', 'amount', 'price', 'fare', 'Amount') ?? 0),
      expressFare: Number(read(fare, 'Express', 'expressFare', 'expressPrice', 'ExpressFare') ?? 0),
      rule: String(read(fare, 'rule', 'discount', 'fareRule', 'Rule') ?? 'BASE'),
      status: String(read(fare, 'status', 'Status') ?? 'Active'),
    })) : [],
    timeFares: normalizedTimeFares,
    publishedAt: String(read(config, 'publishedAt', 'lastPublished', 'updatedAt', 'PublishedAt') ?? ''),
  }
}

function withRouteFlatFares(allFares, routeFares) {
  const all = unwrap(allFares)
  const route = unwrap(routeFares)
  return { ...all, flatFares: read(route, 'flatFares', 'flatFare', 'FlatFares') || [] }
}

function normalizeDistance(value) {
  const result = unwrap(value)
  const rows = Array.isArray(result) ? result : read(result, 'distanceRanges', 'ranges', 'fareSlabs', 'fareBands', 'fares', 'DistanceRanges', 'FareBands') || []
  return Array.isArray(rows) ? rows.map((item, index) => ({
    id: String(read(item, 'id', 'fareId', 'Id') ?? index),
    minimumKm: Number(read(item, 'Minkm', 'minimumKm', 'minKm', 'MinimumKm') ?? 0),
    maximumKm: Number(read(item, 'Maxkm', 'maximumKm', 'maxKm', 'MaximumKm') ?? 0),
    standard: Number(read(item, 'standardFare', 'standard', 'baseFare', 'StandardFare') ?? 0),
    offPeak: Number(read(item, 'offPeakFare', 'offPeak', 'OffPeakFare') ?? 0),
    status: String(read(item, 'status', 'Status') ?? 'Active'),
  })) : []
}

function FareManagementView() {
  const dispatch = useDispatch()
  const { routes: routeRecords, loadStatus: routeLoadStatus, loadError: routeLoadError } = useSelector((state) => state.routes)
  const [common, setCommon] = useState(null)
  const [routeId, setRouteId] = useState('')
  const [commonLoading, setCommonLoading] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [routeSearch, setRouteSearch] = useState('')
  const [notificationAnchor, setNotificationAnchor] = useState(null)
  const [routeMenuAnchor, setRouteMenuAnchor] = useState(null)
  const [fareSearch, setFareSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('All service types')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [editingTables, setEditingTables] = useState({})
  const commonRequestId = useRef(0)
  const activeRoutes = routeRecords.filter((route) => route.active)
  const selectedRouteId = activeRoutes.some((route) => route.id === routeId) ? routeId : activeRoutes[0]?.id || ''

  useEffect(() => {
    let current = true
    dispatch(fetchRoutes()).unwrap()
      .then((routes) => {
        if (!current) return
        const firstActiveRoute = routes.find((route) => route.active)
        if (!firstActiveRoute) throw new Error('No active routes are available for fare configuration.')
        setRouteId(firstActiveRoute.id)
        return Promise.all([getFareConfig(), getFareConfig(firstActiveRoute.id)]).then(([allFares, routeFares]) => withRouteFlatFares(allFares, routeFares))
      })
      .then((commonResult) => {
        if (!current || !commonResult) return
        setCommon(normalizeCommon(commonResult))
        setLoadError('')
      })
      .catch((error) => { if (current) setLoadError(error.message || error || 'Unable to load fare configuration.') })
      .finally(() => { if (current) setLoading(false) })
    return () => { current = false }
  }, [dispatch])

  function updateCommon(field, value) {
    setCommon((current) => ({ ...current, [field]: value }))
    setSaveMessage('')
  }

  function updateCommonRow(field, index, key, value) {
    updateCommon(field, common[field].map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row))
  }

  function toggleTable(table) {
    setEditingTables((current) => ({ ...current, [table]: !current[table] }))
  }

  async function selectFareRoute(nextRouteId) {
    if (!nextRouteId || nextRouteId === selectedRouteId) return
    const requestId = commonRequestId.current + 1
    commonRequestId.current = requestId
    setRouteId(nextRouteId)
    setCommonLoading(true)
    setLoadError('')
    setSaveMessage('')
    try {
      const result = await getFareConfig(nextRouteId)
      if (requestId === commonRequestId.current) setCommon((current) => ({ ...current, flatFares: normalizeCommon(result).flatFares }))
    } catch (error) {
      if (requestId === commonRequestId.current) setLoadError(error.message || 'Unable to load fare configuration for this route.')
    } finally {
      if (requestId === commonRequestId.current) setCommonLoading(false)
    }
  }

  function matchesFilters(row, type) {
    const text = Object.values(row).join(' ').toLowerCase()
    const status = String(row.status ?? 'Active').toLowerCase()
    const normalizedStatus = status === 'active' ? 'active' : status === 'draft' ? 'draft' : status === 'paused' ? 'paused' : status
    return (serviceFilter === 'All service types' || serviceFilter === type)
      && (statusFilter === 'All statuses' || (statusFilter === 'Active and draft' ? ['active', 'draft'].includes(normalizedStatus) : normalizedStatus === statusFilter.toLowerCase()))
      && text.includes(fareSearch.toLowerCase())
  }

  const filteredDistance = common?.distanceFare.filter((row) => matchesFilters(row, 'Distance Based')) || []
  const filteredFlatFares = common?.flatFares.filter((row) => matchesFilters(row, 'Flat Fares')) || []
  const filteredTimeFares = common?.timeFares.filter((row) => matchesFilters(row, 'Time Based')) || []
  const filteredPasses = common?.passes.filter((row) => matchesFilters(row, 'Passes')) || []
  const fareRuleCount = (common?.distanceFare.length || 0) + (common?.flatFares.length || 0) + (common?.timeFares.length || 0) + (common?.passes.length || 0)
  const activeRuleCount = [...(common?.distanceFare || []), ...(common?.flatFares || []), ...(common?.timeFares || []), ...(common?.passes || [])]
    .filter((row) => String(row.status).toLowerCase() === 'active').length

  async function saveChanges() {
    if (!common || !selectedRouteId) return
    setSaving(true)
    setSaveMessage('')
    setLoadError('')
    try {
      await updateFareConfig({
          routeId: selectedRouteId,
          distanceFare: common.distanceFare.map((row) => ({ Id: row.id, Minkm: Number(row.minimumKm), Maxkm: Number(row.maximumKm), StandardFare: Number(row.standard), OffPeakFare: Number(row.offPeak) })),
          flatFares: common.flatFares.map((fare) => ({ Id: fare.id, RouteId: selectedRouteId, PassengerType: fare.label, PassengerDescription: fare.subtitle, Local: Number(fare.localFare), Express: Number(fare.expressFare), Rule: fare.rule, Status: fare.status })),
          timeBasedFares: common.timeFares,
          passes: common.passes.filter((pass) => !pass.isVisitorConfig).map((pass) => ({ ...(pass.id !== undefined ? { Id: pass.id } : {}), PassProduct: pass.name, Tagline: pass.tagline, Price: Number(pass.price), Validity: pass.validity, UsageCondition: pass.usage, IsOn: pass.status.toLowerCase() === 'active' })),
        })
      setSaveMessage('Fare configuration saved.')
    } catch (error) {
      setLoadError(error.message || 'Unable to save fare configuration.')
    } finally {
      setSaving(false)
    }
  }

  const selectedRoute = activeRoutes.find((route) => route.id === selectedRouteId)
  const visibleRoutes = activeRoutes.filter((route) => `${route.routeNumber} ${route.routeName}`.toLowerCase().includes(routeSearch.toLowerCase()))

  return (
    <section className="fare-screen" aria-label="Fare configuration">
      <header className="fare-topbar">
        <div className="fare-title-group"><h1>Shattle Transport Manager - Fare Configuration</h1><span className="fare-live"><i /> SYSTEM LIVE</span></div>
        <div className="fare-header-actions">
          <TextField className="fare-search" size="small" placeholder="Search routes, buses..." value={routeSearch} onChange={(event) => setRouteSearch(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Search routes and buses' }, input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> } }} />
          <IconButton className="fare-notifications" aria-label="Fare notifications" onClick={(event) => setNotificationAnchor(event.currentTarget)}><NotificationsNoneOutlinedIcon /><i /></IconButton>
          <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={() => setNotificationAnchor(null)}><MenuItem onClick={() => setNotificationAnchor(null)}>No new fare notifications</MenuItem></Menu>
        </div>
      </header>
      <div className="fare-routebar">
        <button className="fare-save-button" type="button" onClick={saveChanges} disabled={loading || commonLoading || saving || !common || !selectedRouteId}>
          {saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
          {saving ? 'SAVING...' : 'SAVE ALL CHANGES'}
        </button>
      </div>
      <div className="fare-content">
        {loadError && <Alert severity="error" onClose={() => setLoadError('')}>{loadError}</Alert>}
        {routeLoadStatus === 'failed' && <Alert severity="error" action={<Button color="inherit" size="small" onClick={() => dispatch(fetchRoutes())}>Retry</Button>}>{routeLoadError}</Alert>}
        {saveMessage && <Alert severity="success" onClose={() => setSaveMessage('')}>{saveMessage}</Alert>}
        {loading ? <div className="fare-loading"><CircularProgress size={22} /><span>Loading fare configuration</span></div> : common && (
          <div className="fare-overview">
            <div className="fare-overview-heading">
              <div><h2>Fare tables</h2><p>{selectedRoute ? `Route ${selectedRoute.routeNumber} • ${fareRuleCount} fare rules` : `${fareRuleCount} fare rules`}{common.publishedAt ? ` • Last published ${common.publishedAt}` : ''}</p></div>
              <span className="fare-valid-indicator" title={`${activeRuleCount} active fare rules`}><i /> ALL SECTIONS VALID</span>
            </div>
            <div className="fare-filters">
              <TextField className="fare-table-search" size="small" placeholder="Search fare rules or products" value={fareSearch} onChange={(event) => setFareSearch(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Search fare rules or products' }, input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> } }} />
              <label className="fare-filter-select"><span className="sr-only">Filter by service type</span><select value={serviceFilter} onChange={(event) => setServiceFilter(event.target.value)}><option>All service types</option><option>Distance Based</option><option>Flat Fares</option><option>Time Based</option><option>Passes</option></select><ExpandMoreOutlinedIcon /></label>
              <label className="fare-filter-select"><span className="sr-only">Filter by status</span><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option>All statuses</option><option>Active and draft</option><option>Active</option><option>Draft</option><option>Paused</option></select><ExpandMoreOutlinedIcon /></label>
              <Menu anchorEl={routeMenuAnchor} open={Boolean(routeMenuAnchor)} onClose={() => setRouteMenuAnchor(null)}>
                {visibleRoutes.map((route) => <MenuItem key={route.id} selected={route.id === selectedRouteId} onClick={() => { selectFareRoute(route.id); setRouteMenuAnchor(null) }}>{route.routeNumber ? `Route ${route.routeNumber}` : 'Route'}{route.routeName ? ` - ${route.routeName}` : ''}</MenuItem>)}
              </Menu>
            </div>
            <div className="fare-card-grid">
              {(serviceFilter === 'All service types' || serviceFilter === 'Distance Based') && <FareTableCard title="Distance Based fares" subtitle={`${common.distanceFare.length} distance bands · standard and off-peak pricing`} count={`${common.distanceFare.filter((row) => row.status.toLowerCase() === 'active').length} ACTIVE`} editing={editingTables.distance} onEdit={() => toggleTable('distance')}>
                <table className="overview-table distance-overview-table"><thead><tr><th>DISTANCE</th><th>STANDARD</th><th>OFF-PEAK</th><th>STATUS</th></tr></thead><tbody>{filteredDistance.map((row) => { const index = common.distanceFare.findIndex((item) => item.id === row.id); return <tr key={row.id}><th>{`${row.minimumKm} - ${row.maximumKm} km`}</th><td><FareValue editing={editingTables.distance} value={row.standard} onChange={(value) => updateCommonRow('distanceFare', index, 'standard', value)} /></td><td><FareValue editing={editingTables.distance} value={row.offPeak} onChange={(value) => updateCommonRow('distanceFare', index, 'offPeak', value)} /></td><td><StatusValue ariaLabel={`${row.minimumKm} to ${row.maximumKm} km fare status`} editing={editingTables.distance} status={row.status} onChange={(value) => updateCommonRow('distanceFare', index, 'status', value)} /></td></tr> })}</tbody></table>
              </FareTableCard>}
              {(serviceFilter === 'All service types' || serviceFilter === 'Flat Fares') && <FareTableCard title="Flat Fares" subtitle="Route-level fixed prices by passenger type" count={`${common.flatFares.filter((row) => row.status.toLowerCase() === 'active').length} ACTIVE · ${common.flatFares.filter((row) => row.status.toLowerCase() === 'draft').length} DRAFT`} editing={editingTables.flat} onEdit={() => toggleTable('flat')}>
                <div className="flat-route-control"><label htmlFor="flat-fare-route">ROUTE</label><select id="flat-fare-route" value={selectedRouteId} onChange={(event) => selectFareRoute(event.target.value)} disabled={!activeRoutes.length || commonLoading}>{activeRoutes.map((route) => <option key={route.id} value={route.id}>{route.routeNumber ? `Route ${route.routeNumber}` : 'Route'}{route.routeName ? ` - ${route.routeName}` : ''}</option>)}</select><ExpandMoreOutlinedIcon /></div>
                {commonLoading && <p className="fare-route-loading">Loading route fares...</p>}
                <table className="overview-table"><thead><tr><th>PASSENGER TYPE</th><th>LOCAL</th><th>EXPRESS</th><th>RULE</th><th>STATUS</th></tr></thead><tbody>{filteredFlatFares.map((row) => { const index = common.flatFares.findIndex((item) => item.id === row.id); return <tr key={row.id}><th><strong>{row.label}</strong><small>{row.subtitle}</small></th><td><FareValue editing={editingTables.flat} value={row.localFare} onChange={(value) => updateCommonRow('flatFares', index, 'localFare', value)} /></td><td><FareValue accent editing={editingTables.flat} value={row.expressFare} onChange={(value) => updateCommonRow('flatFares', index, 'expressFare', value)} /></td><td><RuleBadge value={row.rule} /></td><td><StatusValue ariaLabel={`${row.label} status`} editing={editingTables.flat} status={row.status} onChange={(value) => updateCommonRow('flatFares', index, 'status', value)} /></td></tr> })}</tbody></table>
              </FareTableCard>}
              {(serviceFilter === 'All service types' || serviceFilter === 'Time Based') && <FareTableCard title="Time Based fares" subtitle="Weekday operating windows and fare adjustments" count={`${common.timeFares.filter((row) => row.status.toLowerCase() === 'active').length} ACTIVE`} editing={editingTables.time} onEdit={() => toggleTable('time')}>
                <table className="overview-table"><thead><tr><th>PERIOD</th><th>WINDOW</th><th>APPLIES</th><th>FARE RULE</th><th>STATUS</th></tr></thead><tbody>{filteredTimeFares.map((row) => { const index = common.timeFares.findIndex((item) => item.id === row.id); return <tr key={row.id}><th><span className={`period-dot period-${row.id}`} /><strong>{editingTables.time ? <input aria-label={`${row.period} name`} value={row.period} onChange={(event) => updateCommonRow('timeFares', index, 'period', event.target.value)} /> : row.period}</strong></th><td>{editingTables.time ? <input className="plain-edit" aria-label={`${row.period} time window`} value={row.window} onChange={(event) => updateCommonRow('timeFares', index, 'window', event.target.value)} /> : row.window}</td><td>{row.applies}</td><td>{editingTables.time ? <input className="plain-edit" aria-label={`${row.period} fare rule`} value={row.rule} onChange={(event) => updateCommonRow('timeFares', index, 'rule', event.target.value)} /> : <RuleBadge value={row.rule} />}</td><td><StatusValue ariaLabel={`${row.period} status`} editing={editingTables.time} status={row.status} onChange={(value) => updateCommonRow('timeFares', index, 'status', value)} /></td></tr> })}</tbody></table>
              </FareTableCard>}
              {(serviceFilter === 'All service types' || serviceFilter === 'Passes') && <FareTableCard title="Passes" subtitle="Network pass products, validity and availability" count={`${common.passes.filter((row) => row.status.toLowerCase() === 'active').length} ACTIVE`} editing={editingTables.passes} onEdit={() => toggleTable('passes')}>
                <table className="overview-table"><thead><tr><th>PASS PRODUCT</th><th>PRICE</th><th>VALIDITY</th><th>USAGE</th><th>STATUS</th></tr></thead><tbody>{filteredPasses.map((row) => { const index = common.passes.findIndex((item) => item.name === row.name); const isVisitor = row.isVisitorConfig; return <tr key={row.name}><th><strong>{row.name}</strong><small>{row.tagline}</small></th><td><FareValue accent editing={editingTables.passes} value={row.price} onChange={(value) => isVisitor ? setCommon((current) => ({ ...current, visitor: { ...current.visitor, price: value }, passes: current.passes.map((pass) => pass.isVisitorConfig ? { ...pass, price: value } : pass) })) : updateCommonRow('passes', index, 'price', value)} /></td><td>{row.validity}</td><td>{row.usage}</td><td>{isVisitor ? <StatusBadge status={row.status} /> : <StatusValue ariaLabel={`${row.name} status`} editing={editingTables.passes} status={row.status} options={['Active', 'Paused']} onChange={(value) => updateCommonRow('passes', index, 'status', value)} />}</td></tr> })}</tbody></table>
              </FareTableCard>}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function FareTableCard({ title, subtitle, count, editing, onEdit, children }) {
  return (
    <section className="fare-table-card">
      <header className="fare-card-heading"><div><h3>{title}</h3><p>{subtitle}</p></div><div className="fare-card-actions"><span className="fare-count">{count}</span><button type="button" className={`edit-table-button${editing ? ' is-editing' : ''}`} onClick={onEdit}><EditOutlinedIcon />{editing ? 'DONE' : 'EDIT TABLE'}</button></div></header>
      <div className="fare-overview-table-wrap">{children}</div>
    </section>
  )
}

function FareValue({ value, editing, accent = false, onChange }) {
  return editing
    ? <label className={`fare-value-edit${accent ? ' is-accent' : ''}`}><span>LKR</span><input aria-label="Fare amount" type="number" min="0" value={value} onChange={(event) => onChange(event.target.value)} /></label>
    : <span className={`fare-value${accent ? ' is-accent' : ''}`}>LKR {value}</span>
}

function StatusValue({ status, editing, onChange, ariaLabel, options = ['Active', 'Draft', 'Paused'] }) {
  return editing
    ? <select className="fare-status-edit" aria-label={ariaLabel} value={status} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select>
    : <StatusBadge status={status} />
}

function StatusBadge({ status }) {
  const normalized = String(status || 'Active').toLowerCase()
  return <span className={`fare-status-badge status-${normalized}`}>{String(status || 'Active').toUpperCase()}</span>
}

function RuleBadge({ value }) {
  const normalized = String(value || 'BASE').toLowerCase().replace(/[^a-z0-9]+/g, '-')
  return <span className={`fare-rule-badge rule-${normalized}`}>{value}</span>
}

export default FareManagementView