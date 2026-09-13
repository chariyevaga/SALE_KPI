import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

import { listDevices, logoutAll, revokeDevice, type DeviceSessionResponse } from '../api/auth';
import { AppShell } from '../components/AppShell';
import { Spinner } from '../components/Spinner';
import { useTranslation } from '../i18n/locale-store';
import { getDeviceId } from '../lib/device-id';
import { useAuthStore } from '../store/auth-store';

function formatDateTime(value: string, locale: string): string {
  return new Date(value).toLocaleString(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SessionsPage() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((state) => state.clearSession);
  const currentDeviceId = getDeviceId();

  const devicesQuery = useQuery({
    queryKey: ['devices'],
    queryFn: listDevices,
  });

  const revokeMutation = useMutation({
    mutationFn: revokeDevice,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['devices'] }),
  });

  const logoutAllMutation = useMutation({
    mutationFn: logoutAll,
    onSuccess: () => {
      clearSession();
      void navigate('/login', { replace: true });
    },
  });

  function handleRevoke(session: DeviceSessionResponse) {
    if (window.confirm(t('sessions.revokeConfirm'))) {
      revokeMutation.mutate(session.id);
    }
  }

  function handleLogoutAll() {
    if (window.confirm(t('sessions.logoutAllConfirm'))) {
      logoutAllMutation.mutate();
    }
  }

  const sessions = devicesQuery.data ?? [];

  return (
    <AppShell
      title={t('sessions.title')}
      breadcrumbs={[{ label: t('common.home'), to: '/leaderboard' }, { label: t('sessions.title') }]}
    >
      {devicesQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t('sessions.loading')}</p>
      ) : null}

      {devicesQuery.isError ? (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">
          {t('sessions.errorLoading')}
        </p>
      ) : null}

      {!devicesQuery.isLoading && sessions.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">{t('sessions.empty')}</p>
      ) : null}

      {sessions.length > 0 ? (
        <div className="flex flex-col gap-3">
          {sessions.map((session) => {
            const isCurrent = session.deviceId === currentDeviceId;

            return (
              <div
                key={session.id}
                className={`rounded-xl border p-4 transition ${
                  isCurrent
                    ? 'border-emerald-400/60 bg-emerald-400/5'
                    : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {session.deviceName ?? t('sessions.unknownDevice')}
                      </p>
                      {isCurrent ? (
                        <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                          {t('sessions.currentDevice')}
                        </span>
                      ) : null}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {session.rememberMe ? t('sessions.rememberMeBadge') : t('sessions.shortSessionBadge')}
                      </span>
                    </div>

                    <dl className="mt-2 grid gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-2">
                      <div className="flex gap-1.5">
                        <dt>{t('sessions.lastSeen')}:</dt>
                        <dd className="text-slate-700 dark:text-slate-300">
                          {formatDateTime(session.lastSeenAt, locale)}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt>{t('sessions.signedInAt')}:</dt>
                        <dd className="text-slate-700 dark:text-slate-300">
                          {formatDateTime(session.createdAt, locale)}
                        </dd>
                      </div>
                      <div className="flex gap-1.5">
                        <dt title={t('sessions.expiryHint')}>{t('sessions.expiresAt')}:</dt>
                        <dd className="text-slate-700 dark:text-slate-300">
                          {formatDateTime(session.expiresAt, locale)}
                        </dd>
                      </div>
                      {session.ipAddress ? (
                        <div className="flex gap-1.5">
                          <dt>{t('sessions.ipAddress')}:</dt>
                          <dd className="text-slate-700 dark:text-slate-300">{session.ipAddress}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRevoke(session)}
                    disabled={revokeMutation.isPending}
                    className="h-9 flex-shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-red-400"
                  >
                    <span className="flex items-center justify-center gap-2">
                      {revokeMutation.isPending && revokeMutation.variables === session.id ? <Spinner /> : null}
                      {revokeMutation.isPending && revokeMutation.variables === session.id
                        ? t('sessions.revoking')
                        : t('sessions.revoke')}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            onClick={handleLogoutAll}
            disabled={logoutAllMutation.isPending}
            className="mt-2 h-11 rounded-lg bg-red-500/10 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
          >
            <span className="flex items-center justify-center gap-2">
              {logoutAllMutation.isPending ? <Spinner /> : null}
              {t('sessions.logoutAll')}
            </span>
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}
