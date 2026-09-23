import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  getEmployeeKpiPlan,
  getKpiPlanResults,
  getMyKpiPlan,
  listEmployeeKpiPeriods,
  listMyKpiPeriods,
} from '../api/kpi-plans';
import { KpiAchievement, KpiScoreSummary } from './KpiProgress';
import { KpiItemSalary, KpiSalaryCard, SalaryRevealProvider } from './KpiSalary';
import { formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { pickLocalizedText } from '../i18n/localized-text';

/** This month in the `kpi_periods` label format ("2026-09"). */
function currentPeriodLabel(): string {
  const now = new Date();

  return `${String(now.getFullYear())}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

interface EmployeeKpiViewProps {
  /** Whose plan to show; without it the signed-in employee's own ("My KPI"). */
  employeeId?: string | undefined;
  /**
   * Keeps the chosen period in component state, starting from this label, instead of the
   * page URL. For views inside a modal, whose page has its own `?period=`.
   */
  localPeriod?: string | undefined;
  /** Show salary amounts plainly: the employee form, which only full_access users reach. */
  salaryVisible?: boolean;
}

/**
 * An employee's plan: KPIs, weights, targets and results, read-only. "My KPI" shows the
 * signed-in employee's; the employee form's KPI tab and the leaderboard show anyone's to a
 * `full_access` user. The period comes from `?period=2026-09` (other URL parameters such as
 * `?tab=kpi` are kept), or from component state with `localPeriod`; without one this month is
 * shown, or the newest month with a plan when this month has none.
 */
export function EmployeeKpiView({
  employeeId,
  localPeriod,
  salaryVisible = false,
}: EmployeeKpiViewProps) {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [statePeriod, setStatePeriod] = useState(localPeriod);
  const usesState = localPeriod !== undefined;
  const owner = employeeId ?? 'me';

  const periodsQuery = useQuery({
    queryKey: ['kpi-plans', owner, 'periods'],
    queryFn: () => (employeeId ? listEmployeeKpiPeriods(employeeId) : listMyKpiPeriods()),
  });
  const periods = useMemo(() => periodsQuery.data?.items ?? [], [periodsQuery.data]);
  const requested = (usesState ? statePeriod : searchParams.get('period')) ?? currentPeriodLabel();
  const selected = periods.find((entry) => entry.period.label === requested) ?? periods[0];

  // Plan and results load as one unit, so switching months keeps the previous month on screen
  // (dimmed) until the new one is complete, instead of mixing the two.
  const planQuery = useQuery({
    queryKey: ['kpi-plans', owner, 'plan', selected?.period.label],
    queryFn: async () => {
      const month = selected
        ? { year: selected.period.year, month: selected.period.month }
        : undefined;
      const { plan } = employeeId
        ? await getEmployeeKpiPlan(employeeId, month)
        : await getMyKpiPlan(month);

      return { plan, results: plan ? await getKpiPlanResults(plan.id) : null };
    },
    enabled: Boolean(selected),
    placeholderData: keepPreviousData,
  });
  const plan = planQuery.data?.plan ?? null;
  const planResults = planQuery.data?.results ?? null;
  const results = useMemo(
    () => new Map((planResults?.items ?? []).map((item) => [item.itemId, item] as const)),
    [planResults],
  );

  const isLoading = periodsQuery.isLoading || planQuery.isLoading;
  const isError = periodsQuery.isError || planQuery.isError;
  const isOpen = plan?.period.status === 'open';

  function selectPeriod(label: string) {
    if (usesState) {
      setStatePeriod(label);
      return;
    }

    const next = new URLSearchParams(searchParams);

    next.set('period', label);
    setSearchParams(next, { replace: true });
  }

  const salary = planResults?.salary ?? null;

  return (
    <SalaryRevealProvider alwaysVisible={salaryVisible}>
      {periods.length > 0 ? (
        <div className="mb-3 flex items-center gap-3">
          <label
            htmlFor="my-kpi-period"
            className="text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            {t('myKpi.period')}
          </label>
          <select
            id="my-kpi-period"
            value={selected?.period.label ?? ''}
            onChange={(event) => selectPeriod(event.target.value)}
            className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 sm:max-w-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          >
            {periods.map((entry) => (
              <option key={entry.assignmentId} value={entry.period.label}>
                {entry.totalScore === null
                  ? entry.period.label
                  : t('myKpi.periodOption', {
                      period: entry.period.label,
                      score: formatNumber(entry.totalScore, locale),
                    })}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('myKpi.loading')}
        </p>
      ) : null}

      {isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {t(employeeId ? 'myKpi.errorLoadingEmployee' : 'myKpi.errorLoading')}
        </p>
      ) : null}

      {!isLoading && !isError && !plan ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t(employeeId ? 'myKpi.emptyEmployee' : 'myKpi.empty')}
        </p>
      ) : null}

      {plan ? (
        <div
          aria-busy={planQuery.isPlaceholderData}
          className={`flex flex-col gap-3 transition-opacity ${
            planQuery.isPlaceholderData ? 'opacity-60' : ''
          }`}
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {plan.templateName}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span
                aria-hidden="true"
                className={`h-2 w-2 flex-shrink-0 rounded-full ${
                  isOpen ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
                }`}
              />
              {t(isOpen ? 'myKpi.periodOpen' : 'myKpi.periodClosed')}
            </p>

            {planResults ? (
              <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                <KpiScoreSummary
                  totalScore={planResults.totalScore}
                  scoredItemCount={planResults.scoredItemCount}
                  itemCount={planResults.itemCount}
                  calculatedAt={planResults.calculatedAt}
                />
              </div>
            ) : null}
          </div>

          {!salary && employeeId && planResults ? (
            // An administrator looking at someone else: say why no salary card shows.
            <p className="rounded-xl bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              {t('kpiSalary.noSalary')}
            </p>
          ) : null}

          {salary ? (
            <KpiSalaryCard
              salary={salary}
              totalScore={planResults?.totalScore ?? null}
              periodOpen={isOpen}
            />
          ) : null}

          {plan.items.map((item) => {
            const result = results.get(item.id);
            const name = pickLocalizedText(item.definition.name, locale);
            const currency =
              typeof item.inputValues.currency === 'string' ? item.inputValues.currency : undefined;

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
              >
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{name}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {t('myKpi.weight')}: {formatNumber(item.weight, locale)}%
                </p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                  {t('myKpi.target')}:{' '}
                  {item.targetValue === null ? (
                    <span className="text-slate-400 dark:text-slate-500">
                      {t('myKpi.noTarget')}
                    </span>
                  ) : (
                    <span className="font-semibold tabular-nums">
                      {formatNumber(item.targetValue, locale)}
                      {currency ? ` ${currency}` : ''}
                    </span>
                  )}
                </p>

                {result ? (
                  <div className="mt-3 border-t border-slate-100 pt-3 dark:border-slate-800">
                    <KpiAchievement result={result} name={name} currency={currency} />
                    {salary ? <KpiItemSalary result={result} currency={salary.currency} /> : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : null}
    </SalaryRevealProvider>
  );
}
