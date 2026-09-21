import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import { fetchCurrentEmployee } from './api/auth';
import { AdminRoute, ProtectedRoute } from './components/ProtectedRoute';
import { RecordInfoHost } from './components/RecordInfo';
import { useSessionWatchdog } from './lib/session-watchdog';
import { ComingSoonPage } from './pages/ComingSoonPage';
import { EmployeeFormPage } from './pages/EmployeeFormPage';
import { EmployeesPage } from './pages/EmployeesPage';
import { KpiPlanFormPage } from './pages/KpiPlanFormPage';
import { KpiPlansPage } from './pages/KpiPlansPage';
import { KpiTemplateFormPage } from './pages/KpiTemplateFormPage';
import { KpiTemplatesPage } from './pages/KpiTemplatesPage';
import { LoginPage } from './pages/LoginPage';
import { MyKpiPage } from './pages/MyKpiPage';
import { SessionsPage } from './pages/SessionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { useAuthStore } from './store/auth-store';

function SessionBootstrap() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const employee = useAuthStore((state) => state.employee);
  const setEmployee = useAuthStore((state) => state.setEmployee);
  const clearSession = useAuthStore((state) => state.clearSession);

  useSessionWatchdog();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: fetchCurrentEmployee,
    enabled: isAuthenticated && !employee,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setEmployee(meQuery.data);
    }
  }, [meQuery.data, setEmployee]);

  useEffect(() => {
    if (meQuery.isError) {
      // The stored tokens no longer buy access, so treat it as an ended session.
      clearSession('expired');
    }
  }, [meQuery.isError, clearSession]);

  return null;
}

export function App() {
  return (
    <>
      <SessionBootstrap />
      <RecordInfoHost />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/employees"
          element={
            <AdminRoute>
              <EmployeesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/employees/new"
          element={
            <AdminRoute>
              <EmployeeFormPage mode="create" />
            </AdminRoute>
          }
        />
        <Route
          path="/employees/:id"
          element={
            <AdminRoute>
              <EmployeeFormPage mode="edit" />
            </AdminRoute>
          }
        />
        <Route
          path="/kpi-templates"
          element={
            <AdminRoute>
              <KpiTemplatesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/kpi-templates/new"
          element={
            <AdminRoute>
              <KpiTemplateFormPage mode="create" />
            </AdminRoute>
          }
        />
        <Route
          path="/kpi-templates/:id"
          element={
            <AdminRoute>
              <KpiTemplateFormPage mode="edit" />
            </AdminRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sessions"
          element={
            <ProtectedRoute>
              <SessionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <ComingSoonPage titleKey="appShell.navLeaderboard" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-kpi"
          element={
            <ProtectedRoute>
              <MyKpiPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/kpi-plans"
          element={
            <AdminRoute>
              <KpiPlansPage />
            </AdminRoute>
          }
        />
        <Route
          path="/kpi-plans/:id"
          element={
            <AdminRoute>
              <KpiPlanFormPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/leaderboard" replace />} />
      </Routes>
    </>
  );
}
