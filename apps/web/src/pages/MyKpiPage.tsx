import { useQuery } from '@tanstack/react-query';

import { getMyKpiPlan } from '../api/kpi-plans';
import { AppShell } from '../components/AppShell';
import { formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { pickLocalizedText } from '../i18n/localized-text';

/** The signed-in employee's own plan: KPIs, weights and targets, read-only. */
export function MyKpiPage() {
  const { t, locale } = useTranslation();
  const now = new Date();
  const planQuery = useQuery({
    queryKey: ['kpi-plans', 'me', now.getFullYear(), now.getMonth() + 1],
    queryFn: () => getMyKpiPlan({ year: now.getFullYear(), month: now.getMonth() + 1 }),
  });
  const plan = planQuery.data?.plan ?? null;

  return (
    <AppShell
      title={t('myKpi.title')}
      breadcrumbs={[{ label: t('common.home'), to: '/leaderboard' }, { label: t('myKpi.title') }]}
    >
      {planQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('myKpi.loading')}
        </p>
      ) : null}

      {planQuery.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {t('myKpi.errorLoading')}
        </p>
      ) : null}

      {!planQuery.isLoading && !planQuery.isError && !plan ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('myKpi.empty')}
        </p>
      ) : null}

      {plan ? (
        <div className="flex flex-col gap-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {plan.templateName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('myKpi.period')}: {plan.period.label}
            </p>
          </div>

          {plan.items.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {pickLocalizedText(item.definition.name, locale)}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('myKpi.weight')}: {formatNumber(item.weight, locale)}%
              </p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                {t('myKpi.target')}:{' '}
                {item.targetValue === null ? (
                  <span className="text-slate-400 dark:text-slate-500">{t('myKpi.noTarget')}</span>
                ) : (
                  <span className="font-semibold tabular-nums">
                    {formatNumber(item.targetValue, locale)}
                    {typeof item.inputValues.currency === 'string'
                      ? ` ${item.inputValues.currency}`
                      : ''}
                  </span>
                )}
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </AppShell>
  );
}
