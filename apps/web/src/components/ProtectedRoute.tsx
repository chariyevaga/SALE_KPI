import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/auth-store';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Carried through the login form so an expired session returns to the screen it interrupted.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}

/** Admin-only screens; the API enforces this too, this just avoids a dead-end 403 page. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const employee = useAuthStore((state) => state.employee);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  // Wait for the session bootstrap to resolve before deciding.
  if (!employee) {
    return null;
  }

  if (!employee.fullAccess) {
    return <Navigate to="/leaderboard" replace />;
  }

  return children;
}
