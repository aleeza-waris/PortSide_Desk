import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAppSelector } from '@/app/hooks'
import { selectIsAuthenticated } from './authSlice'

/** Layout route: everything nested inside it needs a signed-in user. */
export function RequireAuth() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    // Remember where they were going so login can send them back.
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}
