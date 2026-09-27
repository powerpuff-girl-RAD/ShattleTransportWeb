import { useMemo, useState } from 'react'
import { Button, IconButton, InputAdornment, TextField } from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import ExpandMoreOutlinedIcon from '@mui/icons-material/ExpandMoreOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import './Timetable.css'

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const initialRoutes = [
  {
    id: 'R-245',
    name: 'Colombo ↔ Negombo',
    peak: '30',
    offPeak: '45',
    first: '5:30 AM',
    last: '10:30 PM',
    schedule: {
      Mon: ['06:00', '06:30', '07:00', '07:30', '08:00'], Tue: ['06:00', '06:30', '07:00', '07:30', '08:00'], Wed: ['06:00', '06:30', '07:00', '07:30', '08:00'], Thu: ['06:00', '06:30', '07:00', '07:30', '08:00'], Fri: ['06:00', '06:30', '07:00', '07:30', '08:00'], Sat: ['06:00', '06:30', '07:00'], Sun: ['06:00', '06:30', '07:00'],
    },
  },
  {
    id: 'R-300', name: 'Negombo Reg.', peak: '30', offPeak: '45', first: '5:30 AM', last: '10:30 PM',
    schedule: { Mon: ['06:15', '07:00', '07:45', '08:30', '09:15'], Tue: ['06:15', '07:00', '07:45', '08:30', '09:15'], Wed: ['06:15', '07:00', '07:45', '08:30', '09:15'], Thu: ['06:15', '07:00', '07:45', '08:30', '09:15'], Fri: ['06:15', '07:00', '07:45', '08:30', '09:15'], Sat: ['06:15', '07:00', '07:45'], Sun: ['06:15', '07:00', '07:45'] },
  },
  {
    id: 'R-187', name: 'Airport Exp.', peak: '30', offPeak: '45', first: '5:30 AM', last: '10:30 PM',
    schedule: { Mon: ['05:30', '06:30', '07:30', '08:30', '09:30'], Tue: ['05:30', '06:30', '07:30', '08:30', '09:30'], Wed: ['05:30', '06:30', '07:30', '08:30', '09:30'], Thu: ['05:30', '06:30', '07:30', '08:30', '09:30'], Fri: ['05:30', '06:30', '07:30', '08:30', '09:30'], Sat: ['05:30', '06:30', '07:30'], Sun: ['05:30', '06:30', '07:30'] },
  },
  {
    id: 'R-263', name: 'Katunayake Inner', peak: '30', offPeak: '45', first: '5:30 AM', last: '10:30 PM',
    schedule: { Mon: ['07:00', '08:00', '09:00', '10:00'], Tue: ['07:00', '08:00', '09:00', '10:00'], Wed: ['07:00', '08:00', '09:00', '10:00'], Thu: ['07:00', '08:00', '09:00', '10:00'], Fri: ['07:00', '08:00', '09:00', '10:00'], Sat: ['07:00', '08:00', '09:00'], Sun: ['07:00', '08:00', '09:00'] },
  },
]

function TimetableView() {
  const [selectedDay, setSelectedDay] = useState('All')
  const [selectedRouteId, setSelectedRouteId] = useState('R-245')
  const [routeFilter, setRouteFilter] = useState('')
  const [routes, setRoutes] = useState(initialRoutes)
  const selectedRoute = routes.find((route) => route.id === selectedRouteId) || routes[0]
  const visibleRoutes = useMemo(() => routes.filter((route) => `${route.id} ${route.name}`.toLowerCase().includes(routeFilter.toLowerCase())), [routeFilter, routes])

  function updateHeadway(field, value) {
    setRoutes((currentRoutes) => currentRoutes.map((route) => route.id === selectedRoute.id ? { ...route, [field]: value } : route))
  }

  return (
    <div className="timetable-page">
      <header className="timetable-topbar">
        <h1>Shattle Transport Manager - Timetable Management</h1>
        <span className="timetable-live"><i /> SYSTEM LIVE</span>
        <TextField className="timetable-search" placeholder="Search routes, buses..." slotProps={{ htmlInput: { 'aria-label': 'Search routes and buses' }, input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> } }} />
        <IconButton className="timetable-notifications" aria-label="Notifications"><NotificationsNoneOutlinedIcon /><i /></IconButton>
      </header>

      <div className="timetable-toolbar">
        <div className="timetable-filters">
          <strong>FILTERS:</strong>
          <button className="route-filter" type="button"><span>Route: {routeFilter ? routeFilter : 'All Active Routes'}</span><ExpandMoreOutlinedIcon /></button>
          <div className="day-filter" role="group" aria-label="Filter by day">
            {['All', ...days].map((day) => <button className={selectedDay === day ? 'day-selected' : ''} type="button" key={day} onClick={() => setSelectedDay(day)}>{day}</button>)}
          </div>
        </div>
        <Button startIcon={<AddOutlinedIcon />} onClick={() => setSelectedRouteId(routes[0].id)}>Add Schedule</Button>
      </div>

      <main className="timetable-content">
        <section className="schedule-panel" aria-labelledby="schedule-title">
          <div className="schedule-heading"><h2 id="schedule-title">Weekly Route Schedule Grid</h2><div><span className="legend-peak" /> Peak Hour <span className="legend-offpeak" /> Off-Peak</div></div>
          <div className="schedule-scroll">
            <div className="schedule-grid schedule-grid-head"><span>ROUTE</span>{days.map((day) => <span key={day}>{day.toUpperCase()}</span>)}</div>
            {visibleRoutes.map((route) => <div className={`schedule-grid schedule-row${route.id === selectedRoute.id ? ' schedule-row-selected' : ''}`} key={route.id} onClick={() => setSelectedRouteId(route.id)}>
              <div className="route-label"><strong>{route.id}</strong><span>{route.name}</span></div>
              {days.map((day) => <div className="departure-list" key={day}>{route.schedule[day].map((time, index) => <span className={index >= 2 ? 'peak-time' : 'offpeak-time'} key={time}><i />{time}</span>)}</div>)}
            </div>)}
          </div>
        </section>

        <aside className="schedule-editor">
          <h2>Schedule Editor</h2>
          <div className="selected-route-details"><strong>Selected Route Details</strong><b>Route {selectedRoute.id.replace('R-', '')} {selectedRoute.name.replace(' ↔ ', ' → ')}</b><dl><dt>DEPARTURE INTERVAL</dt><dd>{selectedRoute.peak}min (Peak) / {selectedRoute.offPeak}min (Off-Peak)</dd><dt>FIRST / LAST DEPARTURE</dt><dd>{selectedRoute.first} / {selectedRoute.last}</dd></dl></div>
          <label>PEAK HEADWAY (MINS)<TextField value={selectedRoute.peak} onChange={(event) => updateHeadway('peak', event.target.value)} /></label>
          <label>OFF-PEAK HEADWAY (MINS)<TextField value={selectedRoute.offPeak} onChange={(event) => updateHeadway('offPeak', event.target.value)} /></label>
          <Button className="save-schedule" onClick={() => window.alert(`Schedule changes saved for ${selectedRoute.id}`)}>Save Changes</Button>
          <Button className="analyse-schedule" variant="outlined">Analyse Demand</Button>
        </aside>
      </main>
    </div>
  )
}

export default TimetableView
