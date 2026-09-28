import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  TextField,
} from '@mui/material'
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined'
import AppsOutlinedIcon from '@mui/icons-material/AppsOutlined'
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined'
import CreditCardOutlinedIcon from '@mui/icons-material/CreditCardOutlined'
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined'
import FmdGoodOutlinedIcon from '@mui/icons-material/FmdGoodOutlined'
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined'
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined'
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined'
import { signOut } from '../controllers/authController'
import RoutesView from './RoutesView'
import TimetableView from './TimetableView'
import TripAssignmentView from './TripAssignmentView'
import UserManagementView from './UserManagementView'
import VehicleManagementView from './VehicleManagementView'
import './Dashboard.css'

const navigation = [
  { label: 'Dashboard', Icon: AppsOutlinedIcon },
  { label: 'Vehicle Management', Icon: DirectionsBusOutlinedIcon },
  { label: 'Passengers & Journeys', Icon: GroupsOutlinedIcon },
  { label: 'Overcrowding', Icon: WarningAmberOutlinedIcon },
  { label: 'Timetable', Icon: CalendarMonthOutlinedIcon },
  { label: 'Schedule Management', Icon: ScheduleOutlinedIcon },
  { label: 'Routes', Icon: FmdGoodOutlinedIcon },
  { label: 'Fare Management', Icon: CreditCardOutlinedIcon },
  { label: 'Financial', Icon: BarChartOutlinedIcon },
  { label: 'Inspectors', Icon: ShieldOutlinedIcon },
  { label: 'Reports', Icon: AssessmentOutlinedIcon },
  { label: 'Settings', Icon: SettingsOutlinedIcon },
]

const metrics = [
  { label: 'TOTAL PASSENGERS', value: '124,580', delta: '+14.2%', Icon: GroupsOutlinedIcon },
  { label: 'TOTAL JOURNEYS', value: '89,340', delta: '+8.5%', Icon: FmdGoodOutlinedIcon },
  { label: 'FARES COLLECTED', value: 'LKR 15.2M', delta: '+22.1%', Icon: CreditCardOutlinedIcon },
  { label: 'ACTIVE TOKENS', value: '45,120', delta: '+5.3%', Icon: ShowChartOutlinedIcon },
  { label: 'INVALID JOURNEYS', value: '1,247', delta: '1.4% Rate', negative: true, Icon: ShowChartOutlinedIcon },
  { label: 'INSPECTIONS TODAY', value: '312', delta: 'Target Met', Icon: ShieldOutlinedIcon },
]

const routeRows = [
  { route: 'Route 245', passengers: '32,450', journeys: '24,120', revenue: 'LKR 4.8M', trend: '+ 12%', direction: 'up' },
  { route: 'Route 300', passengers: '28,120', journeys: '19,840', revenue: 'LKR 3.5M', trend: '+ 8%', direction: 'up' },
  { route: 'Route 187', passengers: '15,680', journeys: '11,200', revenue: 'LKR 2.1M', trend: '↓ 4%', direction: 'down' },
  { route: 'Route 263', passengers: '12,340', journeys: '9,120', revenue: 'LKR 1.8M', trend: '+ 15%', direction: 'up' },
  { route: 'Route 150', passengers: '8,920', journeys: '6,430', revenue: 'LKR 1.2M', trend: '→ Stable', direction: 'stable' },
]

const alerts = [
  { title: 'Route 245 Overcrowded', detail: 'Capacity exceeds 92% near Colombo Fort', level: 'critical' },
  { title: 'Inspector Shortage: Shift B', detail: 'Route 187 requires boarding audit scan', level: 'warning' },
  { title: 'Low Passenger Volume alert', detail: 'Route 150 drops 18% in night schedule', level: 'info' },
  { title: 'Ticket Fare Discrepancy', detail: 'Audit flag #TK-8214 insufficient credit', level: 'critical' },
]

const workspaceSections = {
  'Passengers & Journeys': {
    description: 'Passenger activity and journey validation across the network.',
    stats: [['REGISTERED PASSENGERS', '124,580'], ['JOURNEYS TODAY', '89,340'], ['VALIDATION RATE', '98.6%']],
    listTitle: 'Recent passenger journeys',
    columns: ['PASSENGER ID', 'ROUTE', 'VALIDATED AT', 'STATUS'],
    rows: [
      ['PS-10442', 'Route 245', 'Oct 30 · 08:42', 'Validated'],
      ['PS-09218', 'Route 300', 'Oct 30 · 08:39', 'Validated'],
      ['PS-11307', 'Route 187', 'Oct 30 · 08:33', 'Review'],
      ['PS-08155', 'Route 263', 'Oct 30 · 08:27', 'Validated'],
    ],
  },
  Overcrowding: {
    description: 'Monitor vehicle capacity and respond to crowded routes.',
    stats: [['ACTIVE ALERTS', '04'], ['ROUTES ABOVE 85%', '03'], ['AVAILABLE CAPACITY', '18%']],
    listTitle: 'Capacity alerts',
    columns: ['ROUTE', 'OCCUPANCY', 'LOCATION', 'PRIORITY'],
    rows: [
      ['Route 245', '92%', 'Colombo Fort', 'Critical'],
      ['Route 300', '88%', 'Pettah', 'Warning'],
      ['Route 187', '86%', 'Borella', 'Warning'],
      ['Route 150', '64%', 'Nugegoda', 'Normal'],
    ],
  },
  Timetable: {
    description: 'Scheduled departures and live service status.',
    stats: [['SCHEDULED TODAY', '1,284'], ['ON TIME', '96.8%'], ['DELAYED SERVICES', '12']],
    listTitle: 'Upcoming departures',
    columns: ['SERVICE', 'ROUTE', 'DEPARTURE', 'STATUS'],
    rows: [
      ['BUS 0842', 'Route 245', '08:45 · Fort', 'On time'],
      ['BUS 0317', 'Route 300', '08:48 · Pettah', 'On time'],
      ['BUS 1290', 'Route 187', '08:52 · Borella', 'Delayed'],
      ['BUS 0418', 'Route 263', '08:55 · Kotte', 'On time'],
    ],
  },
  'Fare Management': {
    description: 'Fare collection, ticket validation, and payment exceptions.',
    stats: [['FARES COLLECTED', 'LKR 15.2M'], ['ACTIVE TOKENS', '45,120'], ['INVALID JOURNEYS', '1,247']],
    listTitle: 'Recent fare activity',
    columns: ['REFERENCE', 'ROUTE', 'AMOUNT', 'PAYMENT', 'STATUS'],
    rows: [
      ['TK-8218', 'Route 245', 'LKR 120', 'Transit card', 'Settled'],
      ['TK-8217', 'Route 300', 'LKR 80', 'Mobile pass', 'Settled'],
      ['TK-8214', 'Route 187', 'LKR 60', 'Transit card', 'Review'],
      ['TK-8211', 'Route 263', 'LKR 100', 'Cash', 'Settled'],
    ],
  },
  Financial: {
    description: 'Revenue and fare collection across the transit network.',
    stats: [['GROSS REVENUE', 'LKR 15.2M'], ['AVERAGE PER JOURNEY', 'LKR 170'], ['CHANGE THIS MONTH', '+22.1%']],
    listTitle: 'Revenue by route',
    columns: ['ROUTE', 'REVENUE', 'JOURNEYS', 'CHANGE'],
    rows: routeRows.map((row) => [row.route, row.revenue, row.journeys, row.trend]),
  },
  Inspectors: {
    description: 'Inspector coverage, shift assignments, and field activity.',
    stats: [['ACTIVE INSPECTORS', '42'], ['INSPECTIONS TODAY', '312'], ['SHIFTS IN PROGRESS', '08']],
    listTitle: 'Inspector assignments',
    columns: ['INSPECTOR', 'ASSIGNED ZONE', 'SHIFT', 'CHECKS', 'STATUS'],
    rows: [
      ['N. Perera', 'Central', 'Morning', '28', 'On duty'],
      ['S. Fernando', 'North', 'Morning', '24', 'On duty'],
      ['M. Silva', 'East', 'Morning', '19', 'On duty'],
      ['A. Jayasinghe', 'South', 'Evening', '—', 'Upcoming'],
    ],
  },
  Reports: {
    description: 'Operational summaries prepared for review and export.',
    stats: [['AVAILABLE REPORTS', '18'], ['SCHEDULED', '06'], ['UPDATED TODAY', '12']],
    listTitle: 'Recent reports',
    columns: ['REPORT', 'CATEGORY', 'PERIOD', 'UPDATED', 'STATUS'],
    rows: [
      ['Daily ridership', 'Passengers', 'Oct 30', '08:30', 'Ready'],
      ['Fare reconciliation', 'Finance', 'Oct 30', '08:15', 'Ready'],
      ['Route punctuality', 'Operations', 'Oct 29', '23:50', 'Ready'],
      ['Inspector coverage', 'Staffing', 'Oct 29', '18:10', 'Scheduled'],
    ],
  },
}

function Sidebar({ active, onSelect, user, onSignOut }) {
  return (
    <aside className="dash-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo"><DirectionsBusOutlinedIcon /></div>
        <div><strong>SHATTLE</strong><span>TRANSIT SYSTEM</span></div>
      </div>
      <nav className="dash-nav" aria-label="Main navigation">
        {navigation.map(({ label, Icon }) => (
          <button
            className={`nav-item${active === label ? ' is-active' : ''}`}
            type="button"
            key={label}
            onClick={() => onSelect(label)}
            aria-current={active === label ? 'page' : undefined}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
      <button className="sidebar-profile" type="button" onClick={onSignOut} title="Sign out">
        <span className="profile-avatar"><AccountCircleOutlinedIcon /></span>
        <span className="profile-copy"><strong>{user?.name || 'Manager A. Fernando'}</strong><small>{user?.role || 'System Administrator'}</small></span>
      </button>
    </aside>
  )
}

function PassengerChart() {
  return (
    <section className="dashboard-panel passenger-panel">
      <h2>Daily Passenger Volume (Last 30 Days)</h2>
      <div className="line-chart-wrap">
        <svg className="line-chart" viewBox="0 0 560 210" role="img" aria-label="Passenger volume trend increasing over the last 30 days">
          {[26, 76, 126, 176].map((y) => <line className="chart-gridline" x1="0" x2="560" y1={y} y2={y} key={y} />)}
          <path className="passenger-line" d="M4 170 L61 146 L118 181 L175 132 L232 92 L289 80 L346 118 L403 86 L460 45 L517 12 L556 22" />
          {[[4, 170], [61, 146], [118, 181], [175, 132], [232, 92], [289, 80], [346, 118], [403, 86], [460, 45], [517, 12], [556, 22]].map(([cx, cy]) => <circle className="passenger-point" cx={cx} cy={cy} r="3.4" key={`${cx}-${cy}`} />)}
        </svg>
        <div className="chart-axis-labels"><span>Oct 1</span><span>Oct 10</span><span>Oct 20</span><span>Oct 30</span></div>
      </div>
    </section>
  )
}

function RevenueChart() {
  const bars = [
    { route: 'R-245', value: '4.8M', height: '88%' },
    { route: 'R-300', value: '3.5M', height: '64%' },
    { route: 'R-187', value: '2.1M', height: '39%' },
    { route: 'R-263', value: '1.8M', height: '34%' },
  ]

  return (
    <section className="dashboard-panel revenue-panel">
      <h2>Revenue by Route (LKR Millions)</h2>
      <div className="bar-chart">
        {bars.map((bar) => (
          <div className="bar-column" key={bar.route}>
            <strong>{bar.value}</strong>
            <div className="bar-track"><span style={{ height: bar.height }} /></div>
            <small>{bar.route}</small>
          </div>
        ))}
      </div>
    </section>
  )
}

function TopRoutes({ query }) {
  const filteredRows = routeRows.filter((row) => row.route.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="dashboard-panel routes-panel">
      <h2>Top Routes by Usage</h2>
      <div className="routes-table-wrap">
        <table className="routes-table">
          <thead><tr><th>ROUTE</th><th>PASSENGERS</th><th>JOURNEYS</th><th>REVENUE</th><th>TREND</th></tr></thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.route}>
                <th scope="row">{row.route}</th><td>{row.passengers}</td><td>{row.journeys}</td><td>{row.revenue}</td><td className={`trend-${row.direction}`}>{row.trend}</td>
              </tr>
            ))}
            {!filteredRows.length && <tr><td className="empty-routes" colSpan="5">No matching routes</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function CriticalAlerts() {
  return (
    <section className="dashboard-panel alerts-panel">
      <h2>Recent Critical Alerts</h2>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article className="alert-row" key={alert.title}>
            <span className={`alert-dot dot-${alert.level}`} />
            <div className="alert-copy"><strong>{alert.title}</strong><p>{alert.detail}</p></div>
            <span className={`alert-tag tag-${alert.level}`}>{alert.level.toUpperCase()}</span>
          </article>
        ))}
      </div>
    </section>
  )
}

function DashboardOverview({ query }) {
  return (
    <>
      <section className="metric-grid" aria-label="Transit system summary">
        {metrics.map(({ label, value, delta, negative, Icon }) => (
          <article className="metric-card" key={label}>
            <div className="metric-card-head"><span>{label}</span><i><Icon /></i></div>
            <strong className="metric-value">{value}</strong>
            <div className="metric-foot"><span className={negative ? 'delta-negative' : 'delta-positive'}>{delta}</span><small>{negative ? '' : 'vs last month'}</small></div>
          </article>
        ))}
      </section>
      <div className="chart-grid"><PassengerChart /><RevenueChart /></div>
      <div className="detail-grid"><TopRoutes query={query} /><CriticalAlerts /></div>
    </>
  )
}

function WorkspaceSection({ section, query }) {
  const content = workspaceSections[section]
  const filteredRows = content.rows.filter((row) => row.join(' ').toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="workspace-section" aria-labelledby="workspace-title">
      <header className="workspace-heading">
        <div><span>OPERATIONS</span><h2 id="workspace-title">{section}</h2><p>{content.description}</p></div>
        <strong>{filteredRows.length} records</strong>
      </header>
      <div className="workspace-stat-grid">
        {content.stats.map(([label, value]) => (
          <article className="workspace-stat" key={label}><span>{label}</span><strong>{value}</strong></article>
        ))}
      </div>
      <section className="dashboard-panel workspace-list-panel">
        <div className="workspace-list-heading"><h3>{content.listTitle}</h3><span>{filteredRows.length} records</span></div>
        <div className="routes-table-wrap">
          <table className="workspace-table">
            <thead><tr>{content.columns.map((column) => <th key={column}>{column}</th>)}</tr></thead>
            <tbody>
              {filteredRows.map((row, index) => <tr key={`${section}-${index}`}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th scope="row" key={cellIndex}>{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}
              {!filteredRows.length && <tr><td className="empty-routes" colSpan={content.columns.length}>No matching records</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </section>
  )
}

function DashboardView() {
  const dispatch = useDispatch()
  const user = useSelector((state) => state.auth.user)
  const [activeNav, setActiveNav] = useState('Dashboard')
  const [search, setSearch] = useState('')
  const [notificationAnchor, setNotificationAnchor] = useState(null)

  return (
    <main className="dashboard-shell">
      <Sidebar active={activeNav} onSelect={setActiveNav} user={user} onSignOut={() => dispatch(signOut())} />
      <div className="dashboard-main">
        {activeNav === 'Settings' ? <UserManagementView /> : activeNav === 'Routes' ? <RoutesView /> : activeNav === 'Timetable' ? <TimetableView /> : activeNav === 'Schedule Management' ? <TripAssignmentView /> : activeNav === 'Vehicle Management' ? <VehicleManagementView /> : (
          <>
            <header className="dashboard-topbar">
              <h1>Shattle Transport Manager - Operations Console</h1>
              <div className="topbar-controls">
                <TextField
                  className="dashboard-search"
                  size="small"
                  placeholder="Search routes, buses..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  slotProps={{
                    htmlInput: { 'aria-label': 'Search routes and buses' },
                    input: { startAdornment: <InputAdornment position="start"><SearchOutlinedIcon /></InputAdornment> },
                  }}
                />
                <button className="date-control" type="button"><CalendarMonthOutlinedIcon /><span>Oct 1 - Oct 30, 2026</span></button>
                <IconButton className="notification-button" aria-label="Notifications" onClick={(event) => setNotificationAnchor(event.currentTarget)}>
                  <NotificationsNoneOutlinedIcon />
                  <i />
                </IconButton>
                <Menu anchorEl={notificationAnchor} open={Boolean(notificationAnchor)} onClose={() => setNotificationAnchor(null)}>
                  {alerts.slice(0, 3).map((alert) => <MenuItem key={alert.title} onClick={() => setNotificationAnchor(null)}>{alert.title}</MenuItem>)}
                </Menu>
              </div>
            </header>

            <div className="dashboard-content">
              {activeNav === 'Dashboard'
                ? <DashboardOverview query={search} />
                : <WorkspaceSection section={activeNav} query={search} />}
            </div>
          </>
        )}
      </div>
    </main>
  )
}

export default DashboardView
