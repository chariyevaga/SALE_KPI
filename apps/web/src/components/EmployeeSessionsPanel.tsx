import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  listEmployeeSessions,
  revokeAllEmployeeSessions,
  revokeEmployeeSession,
} from '../api/employees';
import { localizeApiError } from '../i18n/api-errors';
import { formatDateTime } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { Spinner } from './Spinner';

/** Admin view of another employee's sessions, with the same actions they have on their own. */
export function EmployeeSessionsPanel({ employeeId }: { employeeId: string }) {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();

  const sessionsQuery = useQuery({
    queryKey: ['employee-sessions', employeeId],
    queryFn: () => listEmployeeSessions(employeeId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['employee-sessions', employeeId] });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => revokeEmployeeSession(employeeId, sessionId),
    onSuccess: invalidate,
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => revokeAllEmployeeSessions(employeeId),
    onSuccess: invalidate,
  });

  const sessions = sessionsQuery.data ?? [];
  const actionError = revokeMutation.isError
    ? localizeApiError(revokeMutation.error, t, 'sessions.revokeError')
    : revokeAllMutation.isError
      ? localizeApiError(revokeAllMutation.error, t, 'sessions.logoutAllError')
      : null;

  if (sessionsQuery.isLoading) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('sessions.loading')}
      </p>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400">
        {t('sessions.errorLoading')}
      </p>
    );
  }

  if (sessions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('sessions.empty')}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 pb-8">
      {actionError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {actionError}
        </p>
      ) : null}

      {sessions.map((session) => (
        <div
          key={session.id}
          className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {session.deviceName ?? t('sessions.unknownDevice')}
                </p>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {session.rememberMe
                    ? t('sessions.rememberMeBadge')
                    : t('sessions.shortSessionBadge')}
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
              onClick={() => {
                if (window.confirm(t('sessions.revokeConfirm'))) {
                  revokeAllMutation.reset();
                  revokeMutation.mutate(session.id);
                }
              }}
              disabled={revokeMutation.isPending}
              className="h-9 flex-shrink-0 rounded-lg border border-slate-300 px-3 text-sm font-medium text-red-500 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-red-400"
            >
              <span className="flex items-center justify-center gap-2">
                {revokeMutation.isPending && revokeMutation.variables === session.id ? (
                  <Spinner />
                ) : null}
                {revokeMutation.isPending && revokeMutation.variables === session.id
                  ? t('sessions.revoking')
                  : t('sessions.revoke')}
              </span>
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => {
          if (window.confirm(t('sessions.logoutAllConfirm'))) {
            revokeMutation.reset();
            revokeAllMutation.mutate();
          }
        }}
        disabled={revokeAllMutation.isPending}
        className="mt-2 h-11 rounded-lg bg-red-500/10 text-sm font-semibold text-red-600 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400"
      >
        <span className="flex items-center justify-center gap-2">
          {revokeAllMutation.isPending ? <Spinner /> : null}
          {t('employeeForm.sessionsRevokeAll')}
        </span>
      </button>
    </div>
  );
}
