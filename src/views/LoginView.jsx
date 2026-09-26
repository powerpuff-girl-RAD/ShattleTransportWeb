import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material'
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import DirectionsBusOutlinedIcon from '@mui/icons-material/DirectionsBusOutlined'
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineOutlined'
import LanguageOutlinedIcon from '@mui/icons-material/LanguageOutlined'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import NotificationsActiveOutlinedIcon from '@mui/icons-material/NotificationsActiveOutlined'
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined'
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined'
import { loginManager } from '../controllers/authController'

function NetworkMap() {
  return (
    <div className="network-map" aria-label="Live transit network map">
      <div className="map-status"><span /> LIVE NETWORK</div>
      <svg className="route-art" viewBox="0 0 552 262" role="img" aria-label="Three active routes across the city">
        <path className="route route-orange" d="M-8 157 L110 123 L232 88 L301 69" />
        <path className="route route-mint" d="M242 112 L333 130 L431 152 L562 180" />
        <path className="route route-blue" d="M136 -10 L165 63 L194 135 L241 263" />
        <path className="route-node" d="M83 160a6 6 0 1 0 12 0a6 6 0 1 0-12 0M176 134a6 6 0 1 0 12 0a6 6 0 1 0-12 0M291 127a6 6 0 1 0 12 0a6 6 0 1 0-12 0M403 143a6 6 0 1 0 12 0a6 6 0 1 0-12 0M488 157a6 6 0 1 0 12 0a6 6 0 1 0-12 0" />
        <circle className="exchange-halo" cx="250" cy="97" r="12" />
        <circle className="exchange-core" cx="250" cy="97" r="8" />
      </svg>
      <div className="exchange-label"><strong>CENTRAL EXCHANGE</strong><span>4 routes · on schedule</span></div>
      <div className="map-footer">
        <span><DirectionsBusOutlinedIcon />184 active vehicles</span>
        <span><NotificationsActiveOutlinedIcon />2 service notices</span>
      </div>
    </div>
  )
}

function OperationsPanel() {
  return (
    <section className="operations-panel" aria-label="Transit operations overview">
      <header className="brand-row">
        <div className="brand-mark"><AccountBalanceOutlinedIcon /></div>
        <div className="brand-name"><strong>CIVIC TRANSIT</strong><span>OPERATIONS REGISTER</span></div>
        <div className="system-status"><span /> SYSTEM OPERATIONAL</div>
      </header>

      <div className="operations-copy">
        <p className="eyebrow"><span>SERVICE COMMAND</span> · MANAGER ACCESS</p>
        <h1>Move the city<br />with confidence.</h1>
        <p className="intro">One secure view of routes, people and service performance across the network.</p>
      </div>

      <NetworkMap />

      <div className="network-metrics">
        <div><span className="metric-label"><i className="mint-dot" />On-time service</span><strong>96.8%</strong><small>+1.4% from yesterday</small></div>
        <div><span className="metric-label"><i className="amber-dot" />Morning coverage</span><strong>42 / 44</strong><small>Two shifts pending</small></div>
        <div><span className="metric-label"><i className="mint-dot" />Open incidents</span><strong>03</strong><small>No critical incidents</small></div>
      </div>

      <footer className="service-footer"><span>Service day · Saturday, 26 September 2026</span><span>Network 3.8</span></footer>
    </section>
  )
}

function LoginView() {
  const dispatch = useDispatch()
  const { status, error } = useSelector((state) => state.auth)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const isLoading = status === 'loading'

  async function handleSubmit(event) {
    event.preventDefault()
    setNotice('')
    try {
      await dispatch(loginManager({ email: email.trim(), password, rememberMe })).unwrap()
    } catch {
      return
    }
  }

  return (
    <main className="portal-shell">
      <OperationsPanel />
      <section className="access-panel">
        <header className="access-topbar">
          <a href="mailto:operations@civictransit.gov">Manager support</a>
          <button className="language-button" type="button" aria-label="Language: English">
            <LanguageOutlinedIcon /> English <span className="chevron-down" />
          </button>
        </header>

        <div className="login-card">
          <div className="card-kicker"><span /> MANAGER PORTAL</div>
          <>
            <h2>Welcome back</h2>
            <p className="card-description">Sign in with your authorised agency credentials to continue to the operations register.</p>
            <form className="login-form" onSubmit={handleSubmit}>
                <label className="field-label" htmlFor="staff-email">Work email or staff ID</label>
                <TextField
                  id="staff-email"
                  className="portal-field"
                  fullWidth
                  autoComplete="username"
                  placeholder="manager@civictransit.gov"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  slotProps={{
                    htmlInput: { 'aria-label': 'Work email or staff ID' },
                    input: {
                      startAdornment: <InputAdornment position="start"><PersonOutlineOutlinedIcon /></InputAdornment>,
                    },
                  }}
                />

                <label className="field-label password-label" htmlFor="staff-password">Password</label>
                <TextField
                  id="staff-password"
                  className="portal-field"
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  slotProps={{
                    htmlInput: { 'aria-label': 'Password' },
                    input: {
                      startAdornment: <InputAdornment position="start"><LockOutlinedIcon /></InputAdornment>,
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            onClick={() => setShowPassword((visible) => !visible)}
                            edge="end"
                            size="small"
                          >
                            {showPassword ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <div className="form-options">
                  <FormControlLabel
                    control={<Checkbox checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} size="small" />}
                    label="Remember me on this device"
                  />
                </div>

                {typeof error === 'string' && error && <Alert className="form-alert" severity="error">{error}</Alert>}
                {notice && <Alert className="form-alert" severity="info" onClose={() => setNotice('')}>{notice}</Alert>}

                <Button className="sign-in-button" type="submit" variant="contained" disabled={isLoading} fullWidth>
                  {isLoading ? <CircularProgress size={20} color="inherit" /> : <>Sign in to portal <ArrowForwardIcon /></>}
                </Button>
            </form>
          </>

          <div className="security-note">
            <div className="security-icon"><SecurityOutlinedIcon /></div>
            <div><strong>Protected agency access</strong><p>Never share your credentials. Sessions lock automatically after 15 minutes of inactivity.</p></div>
          </div>
        </div>

        <footer className="access-footer">
          <span><HelpOutlineOutlinedIcon />Access issue? Contact Operations IT · ext. 4410</span>
          <a href="mailto:operations@civictransit.gov?subject=Security%20policy">Security policy</a>
        </footer>
      </section>
    </main>
  )
}

export default LoginView
