import { useMemo, useState } from 'react'
import { Button, IconButton, InputAdornment, TextField } from '@mui/material'
import AddOutlinedIcon from '@mui/icons-material/AddOutlined'
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined'
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined'
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import './ServiceManagement.css'
import './VehicleManagement.css'

const vehicles = [
  ['Riverline', 'Bus', 'CT-284', 'Central', 'Bus', 'Active', 'mint'],
  ['Garden Loop', 'Bus', 'CT-119', 'North', 'Bus', 'Delayed', 'orange'],
  ['Harbour Crosstown', 'Bus', 'CT-418', 'West', 'Bus', 'Active', 'mint'],
  ['University Link', 'Bus', 'CT-552', 'East', 'Bus', 'Active', 'mint'],
  ['Airport Express', 'Bus', 'CT-901', 'Airport', 'Bus', 'Short turn', 'red'],
  ['Northern Arc', 'Train', 'CT-771', 'North', 'Train', 'Active', 'mint'],
  ['Stadium Shuttle', 'Bus', 'CT-204', 'Central', 'Bus', 'Upcoming', 'blue'],
]

const notices = [
  ['Garden Loop running 7 min late', 'Roadworks · Museum Street', 'warning'],
  ['Airport Express short-turning', '2 trips affected · until 10:10', 'critical'],
  ['Platform change at Central', 'R12 now departs Bay 6', 'info'],
]

function VehicleManagementView() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('All')
  const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => vehicle.join(' ').toLowerCase().includes(search.toLowerCase()) && (status === 'All' || vehicle[5] === status)), [search, status])

  return <div className="service-page vehicle-page">
    <header className="service-topbar"><div className="service-date-status"><span><i /> LIVE FLEET</span><small>Saturday, 26 September 2026 · Morning service</small></div><TextField className="service-global-search" placeholder="Search vehicles, garages, operators..." slotProps={{ htmlInput: { 'aria-label': 'Search vehicles, garages, and operators' }, input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> } }} /><span className="manager-support">? &nbsp; Manager support</span><IconButton className="service-notification" aria-label="Notifications"><NotificationsNoneOutlinedIcon /><i /></IconButton></header>
    <main className="service-content"><div className="service-heading"><div><h1>Vehicle fleet management</h1><p>Monitor fleet health, manage vehicle assignments, and keep operators on schedule.</p></div><div className="service-heading-actions"><Button className="publish-alert"><WarningAmberOutlinedIcon /> Broadcast alert</Button><Button className="add-service" startIcon={<AddOutlinedIcon />}>Add vehicle</Button></div></div>
      <section className="service-kpi-grid"><Kpi label="Total vehicles" value="44" detail="38 buses · 6 trains" icon={<DirectionsBusOutlinedIcon />} tone="teal" /><Kpi label="Buses" value="38" detail="34 active · 4 in depot" icon="✓" tone="green" /><Kpi label="Trains" value="6" detail="5 active · 1 in depot" icon={<DirectionsBusOutlinedIcon />} tone="blue" /><Kpi label="In maintenance" value="3" detail="2 buses · 1 train" icon={<WarningAmberOutlinedIcon />} tone="amber" /></section>
      <div className="service-main-grid"><section className="services-table-panel"><div className="panel-title-row"><div><h2>Vehicles &amp; fleet</h2><p>Live vehicle plan for Saturday 26 September</p></div><Button startIcon={<DownloadOutlinedIcon />}>Export</Button><small>Updated 08:42</small></div><div className="service-table-tools"><TextField placeholder="Search vehicle or ID" value={search} onChange={(event) => setSearch(event.target.value)} slotProps={{ htmlInput: { 'aria-label': 'Search vehicle or ID' }, input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> } }} /><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="All">Status  All</option><option value="Active">Active</option><option value="Delayed">Delayed</option><option value="Upcoming">Upcoming</option></select><button className="mode-button" type="button">Type&nbsp; All</button><IconButton aria-label="More filters"><FilterListOutlinedIcon /></IconButton></div><div className="service-tabs"><button className="selected-tab" type="button">All vehicles · 44</button><button type="button">Active · 39</button><button type="button">Delayed · 3</button><button type="button">In depot · 5</button></div><div className="service-table-wrap"><table className="service-table vehicle-table"><thead><tr><th>VEHICLE</th><th>VEHICLE ID</th><th>DEPOT</th><th>TYPE</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{filteredVehicles.map(([name, category, id, depot, type, vehicleStatus, tone]) => <tr key={id}><th><b>{name}</b><small>{category}</small></th><td><strong>{id}</strong></td><td>{depot}</td><td><strong>{type}</strong></td><td><span className={`service-status status-${tone}`}><i />{vehicleStatus}</span></td><td className="vehicle-actions"><IconButton aria-label={`Edit ${id}`}><EditOutlinedIcon /></IconButton><IconButton aria-label={`Delete ${id}`}><DeleteOutlineOutlinedIcon /></IconButton><IconButton aria-label={`Toggle ${id}`}><span>●</span></IconButton></td></tr>)}</tbody></table></div><div className="table-footer"><span>Showing {filteredVehicles.length} of 44 vehicles</span><div><button type="button">‹</button><b>1</b><span>of 7</span><button type="button">›</button></div></div></section>
        <aside className="service-side-column"><section className="network-card"><div><span><i /> Live fleet</span><small>08:42</small></div><svg viewBox="0 0 300 100" aria-label="Live fleet routes"><path d="M-10 76 C75 50 105 63 180 37 S255 24 310 8" /><path className="network-blue" d="M78 -10 C92 34 102 51 122 111" /><path className="network-green" d="M96 53 C170 45 217 60 310 75" /><circle cx="170" cy="48" r="5" /><circle cx="62" cy="61" r="3" /><circle cx="112" cy="45" r="3" /><circle cx="226" cy="67" r="3" /></svg><div className="network-stats"><strong>96.8%<small>On schedule</small></strong><strong>184<small>Vehicles active</small></strong><strong>03<small>Open alerts</small></strong></div></section><section className="side-panel notices-panel vehicle-notices"><div className="side-panel-heading"><div><h2>Disruptions &amp; alerts</h2><p>3 items need monitoring</p></div><b className="notice-count">3 open</b></div>{notices.map(([title, detail, tone]) => <div className="notice-row" key={title}><span className={`notice-icon notice-${tone}`}><WarningAmberOutlinedIcon /></span><div><b>{title}</b><small>{detail}</small></div><strong>›</strong></div>)}<footer><i /> No critical incidents <b>Manage alerts →</b></footer></section></aside>
      </div>
    </main></div>
}

function Kpi({ icon, label, value, detail, tone }) { return <article className={`service-kpi service-kpi-${tone}`}><div className="service-kpi-head"><span className="service-kpi-icon">{icon}</span><span>{label}</span><b><i /> LIVE</b></div><strong>{value}</strong><small>{detail}</small><span className="kpi-bars"><i /><i /><i /><i /><i /><i /><i /></span></article> }

export default VehicleManagementView
