import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { listEmployees } from '../api/employees';
import {
  assignKpiTemplate,
  closeKpiPeriod,
  copyKpiPlans,
  ensureKpiPeriod,
  listKpiPeriods,
  listKpiPlans,
} from '../api/kpi-plans';
import { listKpiTemplates } from '../api/kpi-templates';
import { AppShell } from '../components/AppShell';
import { Drawer } from '../components/Drawer';
import { FormField, formInputClassName } from '../components/FormField';
import { RecordInfoButton } from '../components/RecordInfo';
import { SelectCheckbox } from '../components/SelectCheckbox';
import { StatusBadge } from '../components/StatusBadge';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import type { EmployeeResponse, KpiPeriod, KpiPlanSkipReason, KpiPlanSummary } from '../types/api';

type Notice = { tone: 'success' | 'error'; text: string } | null;

function employeeName(employee: { firstname: string; lastname: string }): string {
  return `${employee.firstname} ${employee.lastname}`.trim();
}

function skipReason(reason: KpiPlanSkipReason, t: Translate): string {
  switch (reason) {
    case 'already-assigned':
      return t('kpiPlans.reasonAlreadyAssigned');
    case 'inactive':
      return t('kpiPlans.reasonInactive');
    default:
      return t('kpiPlans.reasonMissingErpLink');
  }
}

/** Turns the API's business error `code` (ADR-039) into a message in the chosen language. */
function describeAssignError(error: unknown, t: Translate, employees: EmployeeResponse[]): string {
  if (error instanceof ApiError && error.body?.code) {
    const body = error.body as {
      code?: string;
      employeeIds?: string[];
      employees?: { employeeId: string; reason: KpiPlanSkipReason }[];
    };
    const nameOf = (id: string) =>
      employees.find((employee) => employee.id.toLowerCase() === id.toLowerCase())?.username ?? id;

    switch (body.code) {
      case 'KPI_ASSIGNMENT_EXISTS':
        return t('kpiPlans.alreadyAssigned', {
          names: (body.employeeIds ?? []).map(nameOf).join(', '),
        });
      case 'KPI_ASSIGNMENT_INELIGIBLE':
        return t('kpiPlans.ineligible', {
          names: (body.employees ?? [])
            .map((entry) => `${nameOf(entry.employeeId)} (${skipReason(entry.reason, t)})`)
            .join(', '),
        });
      case 'KPI_PERIOD_CLOSED':
        return t('kpiPlans.periodClosedError');
    }
  }

  return localizeApiError(error, t, 'kpiPlans.assignError');
}

function PeriodStatus({ period }: { period: KpiPeriod }) {
  const { t } = useTranslation();
  const isOpen = period.status === 'open';

  return (
    <StatusBadge
      isActive={isOpen}
      label={t(isOpen ? 'kpiPlans.statusOpen' : 'kpiPlans.statusClosed')}
    />
  );
}

function PlanCard({ plan, periodId }: { plan: KpiPlanSummary; periodId: string }) {
  const { t, locale } = useTranslation();
  const name = employeeName(plan.employee);

  return (
    <div className="flex min-h-[64px] items-center overflow-hidden rounded-xl border border-slate-200 bg-white transition dark:border-slate-800 dark:bg-slate-900">
      <Link
        to={`/kpi-plans/${plan.id}`}
        state={{ periodId }}
        className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 pl-4 pr-2 transition active:bg-slate-100 dark:active:bg-slate-800"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
            {name}
          </span>
          <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
            {plan.templateName}
          </span>
          <span
            className={`mt-0.5 block text-xs ${
              plan.targetCount < plan.itemCount
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {t('kpiPlans.targetProgress', {
              done: formatNumber(plan.targetCount, locale),
              total: formatNumber(plan.itemCount, locale),
            })}
          </span>
        </span>
      </Link>
      <RecordInfoButton tableName="kpi_assignments" recordId={plan.id} title={name} />
    </div>
  );
}

export function KpiPlansPage() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const [periodId, setPeriodId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [newPeriodOpen, setNewPeriodOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const periodsQuery = useQuery({ queryKey: ['kpi-periods'], queryFn: listKpiPeriods });
  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data]);
  const period = periods.find((item) => item.id === periodId) ?? periods[0];
  const previousPeriod = period
    ? periods.find((item) => item.year * 12 + item.month < period.year * 12 + period.month)
    : undefined;

  const plansQuery = useQuery({
    queryKey: ['kpi-plans', period?.id, search],
    queryFn: () => listKpiPlans(period?.id ?? '', 1, search ? { search } : {}),
    enabled: Boolean(period),
  });
  const plans = plansQuery.data?.items ?? [];

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['kpi-periods'] }),
      queryClient.invalidateQueries({ queryKey: ['kpi-plans'] }),
    ]);
  }

  const openPeriodMutation = useMutation({
    mutationFn: ({ year, month }: { year: number; month: number }) => ensureKpiPeriod(year, month),
    onSuccess: async (opened) => {
      setNewPeriodOpen(false);
      setPeriodId(opened.id);
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: localizeApiError(error, t) }),
  });

  const closeMutation = useMutation({
    mutationFn: (id: string) => closeKpiPeriod(id),
    onSuccess: async (closed) => {
      setNotice({ tone: 'success', text: t('kpiPlans.closed', { period: closed.label }) });
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: localizeApiError(error, t) }),
  });

  const copyMutation = useMutation({
    mutationFn: ({ target, source }: { target: string; source: string }) =>
      copyKpiPlans(target, source),
    onSuccess: async (result) => {
      setNotice({
        tone: 'success',
        text:
          result.created === 0
            ? t('kpiPlans.copiedNone')
            : t('kpiPlans.copied', {
                created: formatNumber(result.created, locale),
                skipped: formatNumber(result.skipped.length, locale),
              }),
      });
      await refresh();
    },
    onError: (error) => setNotice({ tone: 'error', text: localizeApiError(error, t) }),
  });

  function closePeriod() {
    if (!period) return;

    if (window.confirm(t('kpiPlans.closeConfirm', { period: period.label }))) {
      closeMutation.mutate(period.id);
    }
  }

  function copyFromPrevious() {
    if (!period || !previousPeriod) return;

    if (window.confirm(t('kpiPlans.copyConfirm', { period: previousPeriod.label }))) {
      copyMutation.mutate({ target: period.id, source: previousPeriod.id });
    }
  }

  const isOpenPeriod = period?.status === 'open';

  return (
    <AppShell
      title={t('kpiPlans.title')}
      fullWidth
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('kpiPlans.title') },
      ]}
      recordInfo={
        period ? { tableName: 'kpi_periods', recordId: period.id, title: period.label } : undefined
      }
    >
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3">
        <select
          value={period?.id ?? ''}
          onChange={(event) => setPeriodId(event.target.value)}
          aria-label={t('kpiPlans.periodLabel')}
          className="h-11 min-w-32 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
        >
          {periods.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
          {periods.length === 0 ? <option value="">—</option> : null}
        </select>

        <button
          type="button"
          onClick={() => setNewPeriodOpen(true)}
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('kpiPlans.newPeriod')}
        </button>

        {period ? <PeriodStatus period={period} /> : null}

        {/* Full row on a phone, next to the period controls from sm up. */}
        <div className="relative w-full min-w-0 sm:ml-auto sm:w-auto sm:max-w-xs sm:flex-1">
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder={t('kpiPlans.searchPlaceholder')}
            aria-label={t('kpiPlans.searchPlaceholder')}
            className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder-slate-400 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
          />
        </div>
      </div>

      {notice ? (
        <p
          role="status"
          className={`mx-4 mb-3 rounded-lg px-3 py-2 text-sm ${
            notice.tone === 'success'
              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/10 text-red-600 dark:text-red-400'
          }`}
        >
          {notice.text}
        </p>
      ) : null}

      {period && !isOpenPeriod ? (
        <p className="mx-4 mb-3 rounded-lg bg-slate-500/10 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
          {t('kpiPlans.periodClosedHint')}
        </p>
      ) : null}

      {periodsQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('kpiPlans.loading')}
        </p>
      ) : null}

      {!periodsQuery.isLoading && periods.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('kpiPlans.emptyPeriods')}
        </p>
      ) : null}

      {plansQuery.isError ? (
        <p
          role="alert"
          className="mx-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {t('kpiPlans.errorLoading')}
        </p>
      ) : null}

      {period && !plansQuery.isLoading && plans.length === 0 && !plansQuery.isError ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {search ? t('kpiPlans.noSearchResults') : t('kpiPlans.empty')}
        </p>
      ) : null}

      {plans.length > 0 ? (
        <>
          <p className="px-4 pb-2 text-xs text-slate-500 dark:text-slate-400">
            {t('kpiPlans.resultCount', {
              count: formatNumber(plansQuery.data?.total ?? plans.length, locale),
            })}
          </p>

          <div className="flex flex-col gap-2 px-4 pb-28 lg:hidden">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} periodId={period?.id ?? ''} />
            ))}
          </div>

          <div className="hidden overflow-x-auto pb-28 lg:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                  <th className="py-2 pl-4 pr-3 font-medium">{t('kpiPlans.columnEmployee')}</th>
                  <th className="py-2 pr-3 font-medium">{t('kpiPlans.columnTemplate')}</th>
                  <th className="py-2 pr-3 text-right font-medium">
                    {t('kpiPlans.columnTargets')}
                  </th>
                  <th className="py-2 pr-4 text-right font-medium">
                    {t('kpiPlans.columnActions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.map((plan) => (
                  <tr
                    key={plan.id}
                    className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900"
                  >
                    <td className="py-2.5 pl-4 pr-3">
                      <Link
                        to={`/kpi-plans/${plan.id}`}
                        state={{ periodId: period?.id }}
                        className="text-sm font-medium text-slate-900 dark:text-slate-100"
                      >
                        {employeeName(plan.employee)}
                      </Link>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        @{plan.employee.username}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-sm text-slate-600 dark:text-slate-300">
                      {plan.templateName}
                    </td>
                    <td
                      className={`py-2.5 pr-3 text-right text-sm tabular-nums ${
                        plan.targetCount < plan.itemCount
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {t('kpiPlans.targetProgress', {
                        done: formatNumber(plan.targetCount, locale),
                        total: formatNumber(plan.itemCount, locale),
                      })}
                    </td>
                    <td className="py-2.5 pr-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/kpi-plans/${plan.id}`}
                          state={{ periodId: period?.id }}
                          aria-label={t('kpiPlans.openPlan', {
                            name: employeeName(plan.employee),
                          })}
                          className="inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
                        >
                          {t('kpiPlans.openPlanShort')}
                        </Link>
                        <RecordInfoButton
                          tableName="kpi_assignments"
                          recordId={plan.id}
                          title={employeeName(plan.employee)}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {period && isOpenPeriod ? (
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:left-72 dark:border-slate-800 dark:bg-slate-950/95">
          <button
            type="button"
            onClick={() => setAssignOpen(true)}
            className="h-12 flex-1 rounded-xl bg-emerald-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 sm:flex-none"
          >
            {t('kpiPlans.assign')}
          </button>
          <button
            type="button"
            onClick={copyFromPrevious}
            disabled={!previousPeriod || copyMutation.isPending}
            className="h-12 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {previousPeriod
              ? t('kpiPlans.copyFrom', { period: previousPeriod.label })
              : t('kpiPlans.noPreviousPeriod')}
          </button>
          <button
            type="button"
            onClick={closePeriod}
            disabled={closeMutation.isPending}
            className="h-12 rounded-xl border border-red-300 px-4 text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-40 dark:border-red-500/40 dark:text-red-400"
          >
            {t('kpiPlans.closePeriod')}
          </button>
        </div>
      ) : null}

      <NewPeriodDrawer
        open={newPeriodOpen}
        onClose={() => setNewPeriodOpen(false)}
        onSubmit={(year, month) => openPeriodMutation.mutate({ year, month })}
        pending={openPeriodMutation.isPending}
      />

      {period ? (
        <AssignDrawer
          open={assignOpen}
          period={period}
          onClose={() => setAssignOpen(false)}
          onAssigned={async (count) => {
            setAssignOpen(false);
            setNotice({
              tone: 'success',
              text: t('kpiPlans.assigned', { count: formatNumber(count, locale) }),
            });
            await refresh();
          }}
          onError={(text) => setNotice({ tone: 'error', text })}
        />
      ) : null}
    </AppShell>
  );
}

function NewPeriodDrawer({
  open,
  onClose,
  onSubmit,
  pending,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (year: number, month: number) => void;
  pending: boolean;
}) {
  const { t } = useTranslation();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      variant="overlay"
      as="aside"
      label={t('kpiPlans.newPeriodTitle')}
      panelClassName="w-[92vw] max-w-sm"
    >
      <div className="flex flex-col gap-4 overflow-y-auto p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('kpiPlans.newPeriodTitle')}
        </h2>

        <FormField label={t('kpiPlans.year')} htmlFor="kpi-period-year">
          <input
            id="kpi-period-year"
            type="number"
            inputMode="numeric"
            min={2000}
            max={2100}
            value={year}
            onChange={(event) => setYear(Number(event.target.value))}
            className={formInputClassName}
          />
        </FormField>

        <FormField label={t('kpiPlans.month')} htmlFor="kpi-period-month">
          <select
            id="kpi-period-month"
            value={month}
            onChange={(event) => setMonth(Number(event.target.value))}
            className={formInputClassName}
          >
            {Array.from({ length: 12 }, (_, index) => index + 1).map((value) => (
              <option key={value} value={value}>
                {String(value).padStart(2, '0')}
              </option>
            ))}
          </select>
        </FormField>

        <button
          type="button"
          disabled={pending}
          onClick={() => onSubmit(year, month)}
          className="h-12 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-60"
        >
          {t('kpiPlans.open')}
        </button>
      </div>
    </Drawer>
  );
}

function AssignDrawer({
  open,
  period,
  onClose,
  onAssigned,
  onError,
}: {
  open: boolean;
  period: KpiPeriod;
  onClose: () => void;
  onAssigned: (count: number) => Promise<void> | void;
  onError: (text: string) => void;
}) {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setSearch(employeeSearch.trim()), 300);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  const templatesQuery = useQuery({
    queryKey: ['kpi-templates', 'list', { isActive: true }],
    queryFn: () => listKpiTemplates(1, { isActive: true }),
    enabled: open,
  });
  const employeesQuery = useQuery({
    queryKey: ['employees', 'assignable', search],
    queryFn: () => listEmployees(1, { isActive: true, ...(search ? { search } : {}) }),
    enabled: open,
  });
  const employees = employeesQuery.data?.items ?? [];

  const assignMutation = useMutation({
    mutationFn: () => assignKpiTemplate(period.id, templateId, selected),
    onSuccess: async (created) => {
      setSelected([]);
      setTemplateId('');
      await onAssigned(created.length);
    },
    onError: (error) => onError(describeAssignError(error, t, employees)),
  });

  const canSubmit = templateId !== '' && selected.length > 0 && !assignMutation.isPending;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      side="right"
      variant="overlay"
      as="aside"
      label={t('kpiPlans.assignTitle')}
      panelClassName="w-[92vw] max-w-md"
    >
      <div className="flex h-full flex-col gap-4 overflow-y-auto p-5">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          {t('kpiPlans.assignTitle')} · {period.label}
        </h2>

        <FormField label={t('kpiPlans.templateLabel')} htmlFor="kpi-plan-template" required>
          <select
            id="kpi-plan-template"
            value={templateId}
            onChange={(event) => setTemplateId(event.target.value)}
            className={formInputClassName}
          >
            <option value="">{t('kpiPlans.selectTemplate')}</option>
            {(templatesQuery.data?.items ?? []).map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>
        </FormField>

        <div className="min-w-0">
          <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
            {t('kpiPlans.employeesLabel')}
          </p>
          <input
            type="search"
            value={employeeSearch}
            onChange={(event) => setEmployeeSearch(event.target.value)}
            placeholder={t('kpiPlans.employeeSearch')}
            aria-label={t('kpiPlans.employeeSearch')}
            className={formInputClassName}
          />

          <div className="mt-2 flex flex-col divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
            {employees.map((employee) => (
              <div key={employee.id} className="flex items-center gap-2 pr-3">
                <SelectCheckbox
                  checked={selected.includes(employee.id)}
                  onChange={(checked) =>
                    setSelected((previous) =>
                      checked
                        ? [...previous, employee.id]
                        : previous.filter((id) => id !== employee.id),
                    )
                  }
                  label={employeeName(employee)}
                />
                <span className="min-w-0 flex-1 py-2">
                  <span className="block truncate text-sm text-slate-900 dark:text-slate-100">
                    {employeeName(employee)}
                  </span>
                  <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                    @{employee.username}
                    {employee.erpEmployeeId === null
                      ? ` · ${t('kpiPlans.reasonMissingErpLink')}`
                      : ''}
                  </span>
                </span>
              </div>
            ))}
            {employees.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('kpiPlans.employeesEmpty')}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={() => assignMutation.mutate()}
          className="mt-auto h-12 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
        >
          {t('kpiPlans.assignSubmit')}
        </button>
      </div>
    </Drawer>
  );
}
