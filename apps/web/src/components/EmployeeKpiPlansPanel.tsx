import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import { listEmployeeKpiPeriods } from '../api/kpi-plans';
import { formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { ProgressMeter } from './ProgressMeter';

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5 flex-shrink-0 text-slate-400"
    >
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * The employee form's "KPI plans" tab: every plan the employee has, newest month first,
 * each opening the plan editor (`/kpi-plans/:id`). Plans are made on the KPI plans screen,
 * which the empty state links to.
 */
export function EmployeeKpiPlansPanel({ employeeId }: { employeeId: string }) {
  const { t, locale } = useTranslation();
  const plansQuery = useQuery({
    queryKey: ['kpi-plans', employeeId, 'periods'],
    queryFn: () => listEmployeeKpiPeriods(employeeId),
  });
  const plans = plansQuery.data?.items ?? [];

  if (plansQuery.isLoading) {
    return (
      <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
        {t('myKpi.loading')}
      </p>
    );
  }

  if (plansQuery.isError) {
    return (
      <p
        role="alert"
        className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
      >
        {t('myKpi.errorLoadingEmployee')}
      </p>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <p className="text-sm text-slate-500 dark:text-slate-400">{t('myKpi.emptyEmployee')}</p>
        <Link
          to="/kpi-plans"
          className="inline-flex min-h-[44px] items-center rounded-lg border border-slate-300 px-4 text-sm font-medium text-slate-700 transition hover:border-emerald-400 dark:border-slate-700 dark:text-slate-200"
        >
          {t('employeeForm.goToKpiPlans')}
        </Link>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {plans.map((plan) => {
        const isOpen = plan.period.status === 'open';

        return (
          <li key={plan.assignmentId}>
            <Link
              to={`/kpi-plans/${plan.assignmentId}`}
              aria-label={t('kpiPlans.openPlan', {
                name: `${plan.period.label} · ${plan.templateName}`,
              })}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-emerald-400 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {plan.period.label}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${
                        isOpen ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                      }`}
                    />
                    {t(isOpen ? 'kpiPlans.statusOpen' : 'kpiPlans.statusClosed')}
                  </span>
                </div>
                <span className="truncate text-sm text-slate-600 dark:text-slate-300">
                  {plan.templateName}
                </span>
                {plan.totalScore === null ? (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {t('kpiProgress.notCalculated')}
                  </span>
                ) : (
                  <div className="flex items-center gap-3">
                    <ProgressMeter
                      className="flex-1"
                      size="sm"
                      value={plan.totalScore}
                      label={t('kpiProgress.totalScore')}
                      valueText={t('kpiPlans.scoreValue', {
                        value: formatNumber(plan.totalScore, locale),
                      })}
                    />
                    <span className="w-20 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                      {t('kpiPlans.scoreValue', { value: formatNumber(plan.totalScore, locale) })}
                    </span>
                  </div>
                )}
              </div>
              <ChevronIcon />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
