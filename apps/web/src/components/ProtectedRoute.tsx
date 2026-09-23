import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { useAuthStore } from '../store/auth-store';
import type { EmployeeResponse } from '../types/api';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // Carried through the login form so an expired session returns to the screen it interrupted.
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}

/**
 * A screen only some employees may open; the API enforces the same rule, this just avoids a
 * dead-end 403 page.
 */
function RestrictedRoute({
  allow,
  children,
}: {
  allow: (employee: EmployeeResponse) => boolean;
  children: ReactNode;
}) {
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

  if (!allow(employee)) {
    return <Navigate to="/leaderboard" replace />;
  }

  return children;
}

/** Admin-only screens. */
export function AdminRoute({ children }: { children: ReactNode }) {
  return <RestrictedRoute allow={(employee) => employee.fullAccess}>{children}</RestrictedRoute>;
}

/** Daily visitor counts: the employees who enter them, and administrators (ADR-043). */
export function VisitorCountsRoute({ children }: { children: ReactNode }) {
  return (
    <RestrictedRoute allow={(employee) => employee.canEnterVisitorCounts || employee.fullAccess}>
      {children}
    </RestrictedRoute>
  );
}
