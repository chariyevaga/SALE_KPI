import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  deleteKpiPlan,
  getKpiPlan,
  getKpiPlanRecommendations,
  saveKpiTargets,
} from '../api/kpi-plans';
import { listStores } from '../api/stores';
import { AppShell } from '../components/AppShell';
import { formInputDenseClassName } from '../components/FormField';
import { localizeApiError } from '../i18n/api-errors';
import { formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { pickLocalizedText } from '../i18n/localized-text';
import { ApiError } from '../lib/api-client';
import type { KpiPlan, KpiPlanItem, KpiPlanRecommendation, StoreOption } from '../types/api';

type Notice = { tone: 'success' | 'error'; text: string } | null;

/** The form keeps targets as text so a cleared field can mean "no target yet". */
type TargetDraft = Record<string, string>;

function draftFromPlan(plan: KpiPlan): TargetDraft {
  return Object.fromEntries(
    plan.items.map((item) => [item.id, item.targetValue === null ? '' : String(item.targetValue)]),
  );
}

function describeSaveError(error: unknown, t: Translate): string {
  if (error instanceof ApiError && error.body?.code === 'KPI_PERIOD_CLOSED') {
    return t('kpiPlanForm.closedError');
  }

  if (error instanceof ApiError && error.body?.code === 'KPI_ASSIGNMENT_INVALID_TARGET') {
    return t('kpiPlanForm.invalidTarget');
  }

  return localizeApiError(error, t, 'kpiPlanForm.saveError');
}

/** Stores and currency of a KPI row, as chosen in the template. */
function inputSummary(item: KpiPlanItem, stores: StoreOption[], t: Translate): string | null {
  const parts: string[] = [];
  const storeIds = item.inputValues.storeIds;

  if (Array.isArray(storeIds) && storeIds.length > 0) {
    const names = storeIds.map((id) => {
      const store = stores.find((option) => option.id === id);

      return store ? (store.name ?? String(store.nr)) : String(id);
    });

    parts.push(`${t('kpiPlanForm.stores')}: ${names.join(', ')}`);
  }

  if (typeof item.inputValues.currency === 'string') {
    parts.push(`${t('kpiPlanForm.currency')}: ${item.inputValues.currency}`);
  }

  return parts.length > 0 ? parts.join(' · ') : null;
}

export function KpiPlanFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, locale } = useTranslation();
  const [draft, setDraft] = useState<TargetDraft>({});
  const [notice, setNotice] = useState<Notice>(null);

  const planQuery = useQuery({
    queryKey: ['kpi-plans', 'detail', id],
    queryFn: () => getKpiPlan(id as string),
    enabled: Boolean(id),
  });
  const plan = planQuery.data;

  const recommendationsQuery = useQuery({
    queryKey: ['kpi-plans', 'recommendations', id],
    queryFn: () => getKpiPlanRecommendations(id as string),
    enabled: Boolean(id),
  });
  const recommendations = useMemo(
    () =>
      new Map((recommendationsQuery.data?.items ?? []).map((item) => [item.itemId, item] as const)),
    [recommendationsQuery.data],
  );

  const storesQuery = useQuery({ queryKey: ['stores', ''], queryFn: () => listStores('') });
  const stores = storesQuery.data ?? [];

  useEffect(() => {
    if (plan) {
      setDraft(draftFromPlan(plan));
    }
  }, [plan]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveKpiTargets(id as string, {
        items: Object.entries(draft).map(([itemId, value]) => ({
          id: itemId,
          targetValue: value.trim() === '' ? null : Number(value),
        })),
      }),
    onSuccess: async () => {
      setNotice({ tone: 'success', text: t('kpiPlanForm.saved') });
      await queryClient.invalidateQueries({ queryKey: ['kpi-plans'] });
    },
    onError: (error) => setNotice({ tone: 'error', text: describeSaveError(error, t) }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteKpiPlan(id as string),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['kpi-plans'] });
      await queryClient.invalidateQueries({ queryKey: ['kpi-periods'] });
      void navigate('/kpi-plans', { replace: true });
    },
    onError: (error) =>
      setNotice({ tone: 'error', text: localizeApiError(error, t, 'kpiPlanForm.deleteError') }),
  });

  const employeeName = plan ? `${plan.employee.firstname} ${plan.employee.lastname}`.trim() : '';
  const isOpen = plan?.period.status === 'open';
  const hasInvalidNumber = Object.values(draft).some(
    (value) => value.trim() !== '' && Number.isNaN(Number(value)),
  );

  function applyRecommendation(item: KpiPlanItem, recommendation: KpiPlanRecommendation) {
    if (recommendation.recommended === null) {
      return;
    }

    setDraft((previous) => ({ ...previous, [item.id]: String(recommendation.recommended) }));
  }

  function applyAll() {
    setDraft((previous) => {
      const next = { ...previous };

      for (const [itemId, recommendation] of recommendations) {
        if (recommendation.recommended !== null) {
          next[itemId] = String(recommendation.recommended);
        }
      }

      return next;
    });
  }

  function removePlan() {
    if (!plan) return;

    if (
      window.confirm(
        t('kpiPlanForm.deleteConfirm', { name: employeeName, period: plan.period.label }),
      )
    ) {
      deleteMutation.mutate();
    }
  }

  return (
    <AppShell
      title={plan ? employeeName : t('kpiPlanForm.title')}
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('kpiPlans.title'), to: '/kpi-plans' },
        { label: plan ? `${plan.period.label} · ${employeeName}` : t('kpiPlanForm.title') },
      ]}
      recordInfo={
        plan ? { tableName: 'kpi_assignments', recordId: plan.id, title: employeeName } : undefined
      }
    >
      {planQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
          {t('kpiPlanForm.loading')}
        </p>
      ) : null}

      {planQuery.isError ? (
        <p
          role="alert"
          className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
        >
          {t('kpiPlanForm.errorLoading')}
        </p>
      ) : null}

      {plan ? (
        <div className="flex flex-col gap-4 pb-28">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {plan.templateName}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {plan.period.label} · @{plan.employee.username} ·{' '}
              {t('kpiPlanForm.weight', { value: formatNumber(plan.totalWeight, locale) })}
            </p>
          </div>

          {!isOpen ? (
            <p className="rounded-lg bg-slate-500/10 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
              {t('kpiPlanForm.closedNotice', { period: plan.period.label })}
            </p>
          ) : null}

          {notice ? (
            <p
              role="status"
              className={`rounded-lg px-3 py-2 text-sm ${
                notice.tone === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
              }`}
            >
              {notice.text}
            </p>
          ) : null}

          {isOpen && recommendations.size > 0 ? (
            <button
              type="button"
              onClick={applyAll}
              className="self-start rounded-lg border border-emerald-400/60 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-400/10 dark:text-emerald-400"
            >
              {t('kpiPlanForm.applyAll')}
            </button>
          ) : null}

          <div className="flex flex-col gap-3">
            {plan.items.map((item) => {
              const recommendation = recommendations.get(item.id);
              const summary = inputSummary(item, stores, t);

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {pickLocalizedText(item.definition.name, locale)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {t('kpiPlanForm.weight', { value: formatNumber(item.weight, locale) })}
                        {summary ? ` · ${summary}` : ''}
                      </p>
                    </div>
                    <span className="flex-shrink-0 rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {item.definition.code}
                    </span>
                  </div>

                  <div className="mt-3 flex items-end gap-2">
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={`target-${item.id}`}
                        className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300"
                      >
                        {t('kpiPlanForm.targetLabel')}
                      </label>
                      <input
                        id={`target-${item.id}`}
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="any"
                        disabled={!isOpen}
                        value={draft[item.id] ?? ''}
                        onChange={(event) =>
                          setDraft((previous) => ({ ...previous, [item.id]: event.target.value }))
                        }
                        placeholder={t('kpiPlanForm.missingTarget')}
                        className={`${formInputDenseClassName} disabled:opacity-60`}
                      />
                    </div>
                    {isOpen && recommendation?.recommended !== null && recommendation ? (
                      <button
                        type="button"
                        onClick={() => applyRecommendation(item, recommendation)}
                        className="h-11 flex-shrink-0 rounded-lg border border-emerald-400/60 px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-400/10 dark:text-emerald-400"
                      >
                        {t('kpiPlanForm.applyRecommendation')}
                      </button>
                    ) : null}
                  </div>

                  {recommendation ? (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {t('kpiPlanForm.recommendation', {
                        average:
                          recommendation.average === null
                            ? '—'
                            : formatNumber(recommendation.average, locale),
                        max:
                          recommendation.achievableMax === null
                            ? '—'
                            : formatNumber(recommendation.achievableMax, locale),
                        recommended:
                          recommendation.recommended === null
                            ? '—'
                            : formatNumber(recommendation.recommended, locale),
                      })}
                      {' · '}
                      {t('kpiPlanForm.recommendationMonths', {
                        count: formatNumber(recommendation.monthCount, locale),
                      })}
                      {recommendation.combined ? ` · ${t('kpiPlanForm.combinedHint')}` : ''}
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {item.definition.inputMode === 'manual'
                        ? t('kpiPlanForm.manualHint')
                        : t('kpiPlanForm.noRecommendation')}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {isOpen ? (
            <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-2 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:left-72 dark:border-slate-800 dark:bg-slate-950/95">
              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || hasInvalidNumber}
                className="h-12 flex-1 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
              >
                {t('kpiPlanForm.save')}
              </button>
              <button
                type="button"
                onClick={removePlan}
                disabled={deleteMutation.isPending}
                className="h-12 rounded-xl border border-red-300 px-4 text-sm font-medium text-red-600 transition hover:bg-red-500/10 disabled:opacity-40 dark:border-red-500/40 dark:text-red-400"
              >
                {t('kpiPlanForm.deletePlan')}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </AppShell>
  );
}
