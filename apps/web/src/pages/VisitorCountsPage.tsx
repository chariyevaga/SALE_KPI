import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import {
  deleteStoreVisitorCount,
  listStoreVisitorCounts,
  saveStoreVisitorCount,
} from '../api/store-visitor-counts';
import { AppShell } from '../components/AppShell';
import { FormField, formInputClassName } from '../components/FormField';
import { RecordInfoButton } from '../components/RecordInfo';
import { StoreLookupField } from '../components/StoreLookupField';
import { localizeApiError } from '../i18n/api-errors';
import { formatDate, formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import { useAuthStore } from '../store/auth-store';
import type { StoreVisitorCount } from '../types/api';

type Notice = { tone: 'success' | 'error'; text: string } | null;

const MAX_VISITOR_COUNT = 1_000_000;

/** Today on this device, `YYYY-MM-DD`: the default day and the latest one the form accepts. */
function localToday(): string {
  const now = new Date();

  return [
    String(now.getFullYear()),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

function storeText(entry: StoreVisitorCount): string {
  if (entry.storeNr === null) {
    return entry.storeName ?? `#${String(entry.storeId)}`;
  }

  return entry.storeName ? `${String(entry.storeNr)} · ${entry.storeName}` : String(entry.storeNr);
}

function describeError(error: unknown, t: Translate): string {
  if (error instanceof ApiError) {
    switch (error.body?.code) {
      case 'STORE_VISITOR_COUNT_UNKNOWN_STORE':
        return t('visitorCounts.errorUnknownStore');
      case 'STORE_VISITOR_COUNT_FUTURE_DATE':
        return t('visitorCounts.errorFutureDate');
      case 'KPI_PERIOD_CLOSED':
        return t('visitorCounts.errorClosed');
    }
  }

  return localizeApiError(error, t, 'visitorCounts.saveError');
}

function TrashIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
    >
      <path
        d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Daily store visitor counts (ADR-043), the denominator of the conversion KPI. Employees with
 * `canEnterVisitorCounts` and administrators enter and correct them; nobody else reaches it
 * (`VisitorCountsRoute`, and the menu hides it).
 */
export function VisitorCountsPage() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const canEnter = useAuthStore(
    (state) =>
      (state.employee?.canEnterVisitorCounts ?? false) || (state.employee?.fullAccess ?? false),
  );
  const [storeIds, setStoreIds] = useState<number[]>([]);
  const [date, setDate] = useState(localToday);
  const [count, setCount] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const storeId = storeIds[0];

  // The list follows the store picked in the form, so its recent days sit under the input.
  const query = useMemo(() => (storeId === undefined ? {} : { storeId }), [storeId]);
  const countsQuery = useInfiniteQuery({
    queryKey: ['store-visitor-counts', query],
    queryFn: ({ pageParam }) => listStoreVisitorCounts(pageParam, query),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
  });
  const entries = useMemo(
    () => countsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [countsQuery.data],
  );
  const existing =
    storeId === undefined
      ? undefined
      : entries.find((entry) => entry.storeId === storeId && entry.date === date);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver((observed) => {
      if (
        observed[0]?.isIntersecting &&
        countsQuery.hasNextPage &&
        !countsQuery.isFetchingNextPage
      ) {
        void countsQuery.fetchNextPage();
      }
    });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [countsQuery]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveStoreVisitorCount({ storeId: storeId ?? 0, date, visitorCount: Number(count) }),
    onSuccess: async (saved) => {
      setNotice({
        tone: 'success',
        text: t('visitorCounts.saved', {
          store: storeText(saved),
          date: formatDate(saved.date, locale),
          count: formatNumber(saved.visitorCount, locale),
        }),
      });
      setCount('');
      await queryClient.invalidateQueries({ queryKey: ['store-visitor-counts'] });
    },
    onError: (error) => setNotice({ tone: 'error', text: describeError(error, t) }),
  });

  const deleteMutation = useMutation({
    mutationFn: (entry: StoreVisitorCount) => deleteStoreVisitorCount(entry.id),
    onSuccess: async () => {
      setNotice({ tone: 'success', text: t('visitorCounts.deleted') });
      await queryClient.invalidateQueries({ queryKey: ['store-visitor-counts'] });
    },
    onError: (error) => setNotice({ tone: 'error', text: describeError(error, t) }),
  });

  const countValue = Number(count);
  const countIsValid =
    count.trim() !== '' &&
    Number.isInteger(countValue) &&
    countValue >= 0 &&
    countValue <= MAX_VISITOR_COUNT;
  const canSave =
    canEnter &&
    storeId !== undefined &&
    date !== '' &&
    date <= localToday() &&
    countIsValid &&
    !saveMutation.isPending;

  function submit(event?: FormEvent) {
    event?.preventDefault();

    if (canSave) {
      setNotice(null);
      saveMutation.mutate();
    }
  }

  function edit(entry: StoreVisitorCount) {
    setStoreIds([entry.storeId]);
    setDate(entry.date);
    setCount(String(entry.visitorCount));
    setNotice(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function remove(entry: StoreVisitorCount) {
    const confirmed = window.confirm(
      t('visitorCounts.deleteConfirm', {
        store: storeText(entry),
        date: formatDate(entry.date, locale),
      }),
    );

    if (confirmed) {
      deleteMutation.mutate(entry);
    }
  }

  return (
    <AppShell
      title={t('visitorCounts.title')}
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('visitorCounts.title') },
      ]}
    >
      <div className="flex flex-col gap-4 pb-28">
        {canEnter ? (
          <form
            onSubmit={submit}
            className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <FormField label={t('visitorCounts.store')} htmlFor="visitor-count-store" required>
              <StoreLookupField
                id="visitor-count-store"
                multiple={false}
                value={storeIds}
                onChange={setStoreIds}
                required
              />
            </FormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField label={t('visitorCounts.date')} htmlFor="visitor-count-date" required>
                <input
                  id="visitor-count-date"
                  type="date"
                  value={date}
                  max={localToday()}
                  onChange={(event) => setDate(event.target.value)}
                  required
                  className={formInputClassName}
                />
              </FormField>
              <FormField label={t('visitorCounts.count')} htmlFor="visitor-count-value" required>
                <input
                  id="visitor-count-value"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={MAX_VISITOR_COUNT}
                  step={1}
                  value={count}
                  onChange={(event) => setCount(event.target.value)}
                  placeholder={t('visitorCounts.countPlaceholder')}
                  required
                  className={formInputClassName}
                />
              </FormField>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {existing
                ? t('visitorCounts.existing', {
                    count: formatNumber(existing.visitorCount, locale),
                  })
                : t('visitorCounts.replaceHint')}
            </p>
          </form>
        ) : (
          <p className="rounded-lg bg-slate-500/10 px-3 py-2 text-sm text-slate-600 dark:text-slate-300">
            {t('visitorCounts.readOnly')}
          </p>
        )}

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

        <section>
          <div className="mb-2 flex min-h-[44px] items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {storeId === undefined ? t('visitorCounts.listAll') : t('visitorCounts.listStore')}
            </h2>
            {storeId !== undefined ? (
              <button
                type="button"
                onClick={() => setStoreIds([])}
                className="h-11 rounded-lg px-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-400/10 dark:text-emerald-400"
              >
                {t('visitorCounts.showAll')}
              </button>
            ) : null}
          </div>

          {countsQuery.isLoading ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('visitorCounts.loading')}
            </p>
          ) : null}

          {countsQuery.isError ? (
            <p
              role="alert"
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400"
            >
              {t('visitorCounts.errorLoading')}
            </p>
          ) : null}

          {!countsQuery.isLoading && !countsQuery.isError && entries.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {t('visitorCounts.empty')}
            </p>
          ) : null}

          {entries.length > 0 ? (
            <>
              <div className="flex flex-col gap-2 lg:hidden">
                {entries.map((entry) => {
                  const dateText = formatDate(entry.date, locale);
                  const body = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {dateText}
                        </span>
                        <span className="block truncate text-xs text-slate-500 dark:text-slate-400">
                          {storeText(entry)}
                        </span>
                      </span>
                      <span className="flex-shrink-0 text-right">
                        <span className="block text-lg font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {formatNumber(entry.visitorCount, locale)}
                        </span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          {t('visitorCounts.people')}
                        </span>
                      </span>
                    </>
                  );

                  return (
                    <div
                      key={entry.id}
                      className="flex min-h-[64px] items-center overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                    >
                      {canEnter ? (
                        <button
                          type="button"
                          onClick={() => edit(entry)}
                          aria-label={t('visitorCounts.editFor', {
                            store: storeText(entry),
                            date: dateText,
                          })}
                          className="flex min-w-0 flex-1 items-center gap-3 self-stretch py-3 pl-4 pr-2 text-left transition active:bg-slate-100 dark:active:bg-slate-800"
                        >
                          {body}
                        </button>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 pr-2">
                          {body}
                        </div>
                      )}
                      {canEnter ? (
                        <button
                          type="button"
                          onClick={() => remove(entry)}
                          disabled={deleteMutation.isPending}
                          aria-label={t('visitorCounts.deleteFor', {
                            store: storeText(entry),
                            date: dateText,
                          })}
                          title={t('visitorCounts.deleteFor', {
                            store: storeText(entry),
                            date: dateText,
                          })}
                          className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
                        >
                          <TrashIcon />
                        </button>
                      ) : null}
                      <RecordInfoButton
                        tableName="store_visitor_counts"
                        recordId={entry.id}
                        title={`${storeText(entry)} · ${dateText}`}
                      />
                    </div>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-y border-slate-200 bg-slate-50/60 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                      <th className="py-2 pl-4 pr-3 font-medium">
                        {t('visitorCounts.columnDate')}
                      </th>
                      <th className="py-2 pr-3 font-medium">{t('visitorCounts.columnStore')}</th>
                      <th className="py-2 pr-3 text-right font-medium">
                        {t('visitorCounts.columnCount')}
                      </th>
                      <th className="py-2 pr-4 text-right font-medium">
                        {t('visitorCounts.columnActions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map((entry) => {
                      const dateText = formatDate(entry.date, locale);

                      return (
                        <tr
                          key={entry.id}
                          className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900"
                        >
                          <td className="py-2.5 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                            {dateText}
                          </td>
                          <td className="py-2.5 pr-3 text-sm text-slate-600 dark:text-slate-300">
                            {storeText(entry)}
                          </td>
                          <td className="py-2.5 pr-3 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                            {formatNumber(entry.visitorCount, locale)}
                          </td>
                          <td className="py-2.5 pr-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {canEnter ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => edit(entry)}
                                    aria-label={t('visitorCounts.editFor', {
                                      store: storeText(entry),
                                      date: dateText,
                                    })}
                                    className="inline-flex h-8 items-center rounded-lg px-2 text-sm font-medium text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
                                  >
                                    {t('visitorCounts.edit')}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => remove(entry)}
                                    disabled={deleteMutation.isPending}
                                    aria-label={t('visitorCounts.deleteFor', {
                                      store: storeText(entry),
                                      date: dateText,
                                    })}
                                    title={t('visitorCounts.deleteFor', {
                                      store: storeText(entry),
                                      date: dateText,
                                    })}
                                    className="inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
                                  >
                                    <TrashIcon />
                                  </button>
                                </>
                              ) : null}
                              <RecordInfoButton
                                tableName="store_visitor_counts"
                                recordId={entry.id}
                                title={`${storeText(entry)} · ${dateText}`}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          <div ref={sentinelRef} className="h-1" />
        </section>
      </div>

      {canEnter ? (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:left-72 dark:border-slate-800 dark:bg-slate-950/95">
          <button
            type="button"
            onClick={() => submit()}
            disabled={!canSave}
            className="h-12 w-full rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40 sm:w-auto sm:px-10"
          >
            {saveMutation.isPending
              ? t('visitorCounts.saving')
              : existing
                ? t('visitorCounts.update')
                : t('visitorCounts.save')}
          </button>
        </div>
      ) : null}
    </AppShell>
  );
}
