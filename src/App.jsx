import { useDispatch, useSelector } from 'react-redux'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material'
import './App.css'
import { signOut } from './controllers/authController'
import DashboardView from './views/DashboardView'
import LoginView from './views/LoginView'

function App() {
  const dispatch = useDispatch()
  const { user, error } = useSelector((state) => state.auth)
  const isManager = user?.role?.trim().toLowerCase() === 'manager'
  const showRoleDenied = Boolean(user && !isManager) || error?.code === 'ROLE_FORBIDDEN'

  function closeRoleDenied() {
    dispatch(signOut())
  }

  return (
    <>
      {isManager ? <DashboardView /> : <LoginView />}
      <Dialog open={showRoleDenied} onClose={closeRoleDenied} aria-labelledby="role-denied-title">
        <DialogTitle id="role-denied-title">Manager access required</DialogTitle>
        <DialogContent>
          This account is not assigned the Manager role. Contact your system administrator to request access.
        </DialogContent>
        <DialogActions>
          <Button onClick={closeRoleDenied} variant="contained">Return to sign in</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default App
