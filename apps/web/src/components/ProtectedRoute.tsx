import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { useAuthStore } from '../store/auth-store';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

/** Admin-only screens; the API enforces this too, this just avoids a dead-end 403 page. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const employee = useAuthStore((state) => state.employee);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
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
