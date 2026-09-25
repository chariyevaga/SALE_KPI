import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  deleteStoreVisitorCount,
  listStoreVisitorCounts,
  saveStoreVisitorCount,
  type StoreVisitorCountQuery,
} from '../api/store-visitor-counts';
import { AppShell } from '../components/AppShell';
import { Drawer } from '../components/Drawer';
import { FormField, formInputClassName } from '../components/FormField';
import { Modal } from '../components/Modal';
import { RecordInfoButton } from '../components/RecordInfo';
import { StoreLookupField } from '../components/StoreLookupField';
import { VisitorCountImportModal } from '../components/VisitorCountImportModal';
import { localizeApiError } from '../i18n/api-errors';
import { formatDate, formatNumber } from '../i18n/formatters';
import { useTranslation, type Translate } from '../i18n/locale-store';
import { ApiError } from '../lib/api-client';
import { useAuthStore } from '../store/auth-store';
import type { StoreVisitorCount } from '../types/api';
import { confirmAction } from '../store/confirm-store';

type Notice = { tone: 'success' | 'error'; text: string } | null;

const MAX_VISITOR_COUNT = 1_000_000;
/** How long a success message stays before it fades out on its own. */
const NOTICE_MS = 4000;
const DATE_PARAM = /^\d{4}-\d{2}-\d{2}$/;

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

// ---------------------------------------------------------------------------
// Filters: store and date range, kept in the URL (`?store=12&from=…&to=…`)
// ---------------------------------------------------------------------------

interface Filters {
  storeId: number | undefined;
  from: string;
  to: string;
}

const NO_FILTERS: Filters = { storeId: undefined, from: '', to: '' };

function readFilters(params: URLSearchParams): Filters {
  const store = Number(params.get('store'));
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';

  return {
    storeId: Number.isInteger(store) && store > 0 ? store : undefined,
    from: DATE_PARAM.test(from) ? from : '',
    to: DATE_PARAM.test(to) ? to : '',
  };
}

function countFilters(filters: Filters): number {
  return (filters.storeId === undefined ? 0 : 1) + (filters.from || filters.to ? 1 : 0);
}

function toQuery(filters: Filters): StoreVisitorCountQuery {
  return {
    ...(filters.storeId === undefined ? {} : { storeId: filters.storeId }),
    ...(filters.from ? { from: filters.from } : {}),
    ...(filters.to ? { to: filters.to } : {}),
  };
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

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

function CloseIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      stroke="currentColor"
      strokeWidth="2.5"
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Add / edit modal
// ---------------------------------------------------------------------------

interface CountModalProps {
  /** The entry being corrected; without it the modal adds a new count. */
  entry: StoreVisitorCount | null;
  /** Store to start with when adding: the one the list is filtered by. */
  initialStoreId: number | undefined;
  onClose: () => void;
  onSaved: (saved: StoreVisitorCount) => void;
}

/**
 * Enters or corrects one store-day count. A correction keeps its store and day (they are
 * what identifies the count); adding checks whether that store and day already have a
 * number, since saving it again replaces it.
 */
function CountModal({ entry, initialStoreId, onClose, onSaved }: CountModalProps) {
  const { t, locale } = useTranslation();
  const isEdit = entry !== null;
  const [storeIds, setStoreIds] = useState<number[]>(
    entry ? [entry.storeId] : initialStoreId === undefined ? [] : [initialStoreId],
  );
  const [date, setDate] = useState(entry?.date ?? localToday());
  const [count, setCount] = useState(entry ? String(entry.visitorCount) : '');
  const storeId = storeIds[0];

  // Adding: is there already a number for this store and day?
  const existingQuery = useQuery({
    queryKey: ['store-visitor-counts', 'day', storeId, date],
    queryFn: () => listStoreVisitorCounts(1, { storeId: storeId ?? 0, from: date, to: date }),
    enabled: !isEdit && storeId !== undefined && DATE_PARAM.test(date),
  });
  const existing = isEdit ? undefined : existingQuery.data?.items[0];

  const saveMutation = useMutation({
    mutationFn: () =>
      saveStoreVisitorCount({ storeId: storeId ?? 0, date, visitorCount: Number(count) }),
    onSuccess: onSaved,
  });

  const countValue = Number(count);
  const countIsValid =
    count.trim() !== '' &&
    Number.isInteger(countValue) &&
    countValue >= 0 &&
    countValue <= MAX_VISITOR_COUNT;
  const canSave =
    storeId !== undefined &&
    date !== '' &&
    date <= localToday() &&
    countIsValid &&
    !saveMutation.isPending;

  function submit(event: FormEvent) {
    event.preventDefault();

    if (canSave) {
      saveMutation.mutate();
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={t(isEdit ? 'visitorCounts.editTitle' : 'visitorCounts.addTitle')}
      headerActions={
        entry ? (
          <RecordInfoButton
            tableName="store_visitor_counts"
            recordId={entry.id}
            title={`${storeText(entry)} · ${formatDate(entry.date, locale)}`}
          />
        ) : undefined
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        {entry ? (
          // A correction cannot move the count to another store or day.
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm dark:bg-slate-800/60">
            <p className="font-semibold text-slate-900 dark:text-slate-100">
              {formatDate(entry.date, locale)}
            </p>
            <p className="truncate text-slate-600 dark:text-slate-300">{storeText(entry)}</p>
          </div>
        ) : (
          <>
            <FormField label={t('visitorCounts.store')} htmlFor="visitor-count-store" required>
              <StoreLookupField
                id="visitor-count-store"
                multiple={false}
                value={storeIds}
                onChange={setStoreIds}
                required
              />
            </FormField>
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
          </>
        )}

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
            autoFocus={isEdit}
            required
            className={formInputClassName}
          />
        </FormField>

        {!isEdit ? (
          <p
            className={`text-xs ${
              existing
                ? 'rounded-lg bg-amber-500/10 px-3 py-2 text-amber-700 dark:text-amber-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {existing
              ? t('visitorCounts.existing', { count: formatNumber(existing.visitorCount, locale) })
              : t('visitorCounts.replaceHint')}
          </p>
        ) : null}

        {saveMutation.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {describeError(saveMutation.error, t)}
          </p>
        ) : null}

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!canSave}
            className="h-12 flex-1 rounded-xl bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
          >
            {saveMutation.isPending
              ? t('visitorCounts.saving')
              : isEdit || existing
                ? t('visitorCounts.update')
                : t('visitorCounts.save')}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Daily store visitor counts (ADR-043), the denominator of the conversion KPI. The page is
 * the list only: filtered by store and date range (right-hand panel, applied with "Apply"),
 * a count is added with the floating button and corrected by tapping it, both in a modal.
 * Employees with `canEnterVisitorCounts` and administrators reach it; nobody else
 * (`VisitorCountsRoute`, and the menu hides it).
 */
export function VisitorCountsPage() {
  const { t, locale } = useTranslation();
  const queryClient = useQueryClient();
  const canEnter = useAuthStore(
    (state) =>
      (state.employee?.canEnterVisitorCounts ?? false) || (state.employee?.fullAccess ?? false),
  );
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = useMemo(() => readFilters(searchParams), [searchParams]);
  const activeFilterCount = countFilters(filters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [draft, setDraft] = useState<Filters>(filters);
  // `null` closed, `'new'` adding, an entry when correcting it.
  const [editing, setEditing] = useState<StoreVisitorCount | 'new' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [importOpen, setImportOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const query = useMemo(() => toQuery(filters), [filters]);
  const countsQuery = useInfiniteQuery({
    queryKey: ['store-visitor-counts', 'list', query],
    queryFn: ({ pageParam }) => listStoreVisitorCounts(pageParam, query),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page * lastPage.limit < lastPage.total ? lastPage.page + 1 : undefined,
  });
  const entries = useMemo(
    () => countsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [countsQuery.data],
  );
  const total = countsQuery.data?.pages[0]?.total ?? 0;
  // The filtered store's name, read from its rows; the id alone means nothing to people.
  const filteredStoreName =
    filters.storeId === undefined
      ? ''
      : (() => {
          const row = entries.find((entry) => entry.storeId === filters.storeId);

          return row ? storeText(row) : `#${String(filters.storeId)}`;
        })();

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

  useEffect(() => {
    if (notice?.tone !== 'success') return;

    const timer = window.setTimeout(() => setNotice(null), NOTICE_MS);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const deleteMutation = useMutation({
    mutationFn: (entry: StoreVisitorCount) => deleteStoreVisitorCount(entry.id),
    onSuccess: async () => {
      setNotice({ tone: 'success', text: t('visitorCounts.deleted') });
      await queryClient.invalidateQueries({ queryKey: ['store-visitor-counts'] });
    },
    onError: (error) => setNotice({ tone: 'error', text: describeError(error, t) }),
  });

  function applyFilters(next: Filters) {
    const params: Record<string, string> = {};

    if (next.storeId !== undefined) params.store = String(next.storeId);
    if (next.from) params.from = next.from;
    if (next.to) params.to = next.to;

    setSearchParams(params, { replace: true });
  }

  function openFilters() {
    setDraft(filters);
    setFilterOpen(true);
  }

  const draftRangeInvalid = draft.from !== '' && draft.to !== '' && draft.from > draft.to;

  async function handleSaved(saved: StoreVisitorCount) {
    setEditing(null);
    setNotice({
      tone: 'success',
      text: t('visitorCounts.saved', {
        store: storeText(saved),
        date: formatDate(saved.date, locale),
        count: formatNumber(saved.visitorCount, locale),
      }),
    });
    await queryClient.invalidateQueries({ queryKey: ['store-visitor-counts'] });
  }

  async function remove(entry: StoreVisitorCount) {
    const confirmed = await confirmAction({
      message: t('visitorCounts.deleteConfirm', {
        store: storeText(entry),
        date: formatDate(entry.date, locale),
      }),
      tone: 'danger',
    });

    if (confirmed) {
      setNotice(null);
      deleteMutation.mutate(entry);
    }
  }

  const rangeText =
    filters.from && filters.to
      ? `${formatDate(filters.from, locale)} – ${formatDate(filters.to, locale)}`
      : filters.from
        ? t('visitorCounts.rangeFrom', { date: formatDate(filters.from, locale) })
        : filters.to
          ? t('visitorCounts.rangeTo', { date: formatDate(filters.to, locale) })
          : '';

  return (
    <AppShell
      title={t('visitorCounts.title')}
      breadcrumbs={[
        { label: t('common.home'), to: '/leaderboard' },
        { label: t('visitorCounts.title') },
      ]}
    >
      <Drawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        side="right"
        variant="overlay"
        as="aside"
        label={t('visitorCounts.filters')}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            {t('visitorCounts.filters')}
          </h2>
          <button
            type="button"
            onClick={() => setFilterOpen(false)}
            aria-label={t('common.close')}
            className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
          <FormField label={t('visitorCounts.store')} htmlFor="visitor-filter-store">
            <StoreLookupField
              id="visitor-filter-store"
              multiple={false}
              value={draft.storeId === undefined ? [] : [draft.storeId]}
              onChange={(ids) => setDraft((prev) => ({ ...prev, storeId: ids[0] }))}
            />
          </FormField>

          <fieldset className="space-y-3">
            <legend className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {t('visitorCounts.filterDates')}
            </legend>
            <FormField label={t('visitorCounts.filterFrom')} htmlFor="visitor-filter-from">
              <input
                id="visitor-filter-from"
                type="date"
                value={draft.from}
                max={draft.to || localToday()}
                onChange={(event) => setDraft((prev) => ({ ...prev, from: event.target.value }))}
                className={formInputClassName}
              />
            </FormField>
            <FormField label={t('visitorCounts.filterTo')} htmlFor="visitor-filter-to">
              <input
                id="visitor-filter-to"
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                max={localToday()}
                onChange={(event) => setDraft((prev) => ({ ...prev, to: event.target.value }))}
                className={formInputClassName}
              />
            </FormField>
            {draftRangeInvalid ? (
              <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                {t('visitorCounts.rangeInvalid')}
              </p>
            ) : null}
          </fieldset>
        </div>

        <div className="flex gap-2 border-t border-slate-200 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              setDraft(NO_FILTERS);
              applyFilters(NO_FILTERS);
              setFilterOpen(false);
            }}
            className="h-11 flex-1 rounded-lg border border-slate-300 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            {t('common.clear')}
          </button>
          <button
            type="button"
            disabled={draftRangeInvalid}
            onClick={() => {
              applyFilters(draft);
              setFilterOpen(false);
            }}
            className="h-11 flex-1 rounded-lg bg-emerald-400 text-sm font-semibold text-slate-950 transition hover:bg-emerald-300 disabled:opacity-40"
          >
            {t('common.apply')}
          </button>
        </div>
      </Drawer>

      <div className="flex flex-col gap-3 pb-24">
        {/* Toolbar: result count left, filter button right */}
        <div className="flex min-h-[44px] items-center justify-between gap-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {countsQuery.isSuccess
              ? t('visitorCounts.resultCount', { count: formatNumber(total, locale) })
              : ''}
          </p>
          <div className="flex items-center gap-2">
            {canEnter ? (
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                aria-label={t('visitorCounts.excelTitle')}
                title={t('visitorCounts.excelTitle')}
                className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-4 w-4"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    d="M4 5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5Zm0 5h16M4 15h16M10 4v16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {t('visitorCounts.excel')}
              </button>
            ) : null}
            <button
              type="button"
              onClick={openFilters}
              className={`relative flex h-11 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition ${
                activeFilterCount > 0
                  ? 'border-emerald-400 bg-emerald-400/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900'
              }`}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 5h18M6 12h12M10 19h4" strokeLinecap="round" />
              </svg>
              {t('visitorCounts.filters')}
              {activeFilterCount > 0 ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-400 px-1 text-[11px] font-bold text-slate-950">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>

        {/* Applied filters, each removable on its own */}
        {activeFilterCount > 0 ? (
          <div className="flex flex-wrap gap-2 text-xs">
            {filters.storeId !== undefined ? (
              <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-emerald-400/15 py-1 pl-3 pr-1 font-medium text-emerald-800 dark:text-emerald-300">
                <span className="truncate">{filteredStoreName}</span>
                <button
                  type="button"
                  onClick={() => applyFilters({ ...filters, storeId: undefined })}
                  aria-label={t('visitorCounts.removeFilter', { filter: filteredStoreName })}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-emerald-400/20"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ) : null}
            {rangeText ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 py-1 pl-3 pr-1 font-medium text-emerald-800 dark:text-emerald-300">
                {rangeText}
                <button
                  type="button"
                  onClick={() => applyFilters({ ...filters, from: '', to: '' })}
                  aria-label={t('visitorCounts.removeFilter', { filter: rangeText })}
                  className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition hover:bg-emerald-400/20"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </span>
            ) : null}
          </div>
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

        {countsQuery.isSuccess && entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {activeFilterCount > 0 ? t('visitorCounts.emptyFiltered') : t('visitorCounts.empty')}
          </p>
        ) : null}

        {entries.length > 0 ? (
          <>
            {/* < lg: one card per count */}
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
                        onClick={() => setEditing(entry)}
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
                        onClick={() => void remove(entry)}
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

            {/* ≥ lg: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-slate-200 lg:block dark:border-slate-800">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                    <th className="py-2.5 pl-4 pr-3 font-medium">
                      {t('visitorCounts.columnDate')}
                    </th>
                    <th className="py-2.5 pr-3 font-medium">{t('visitorCounts.columnStore')}</th>
                    <th className="py-2.5 pr-3 text-right font-medium">
                      {t('visitorCounts.columnCount')}
                    </th>
                    <th className="py-2.5 pr-4 text-right font-medium">
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
                        <td className="py-2 pl-4 pr-3 text-sm font-medium text-slate-900 dark:text-slate-100">
                          {dateText}
                        </td>
                        <td className="py-2 pr-3 text-sm text-slate-600 dark:text-slate-300">
                          {storeText(entry)}
                        </td>
                        <td className="py-2 pr-3 text-right text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {formatNumber(entry.visitorCount, locale)}
                        </td>
                        <td className="py-2 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEnter ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setEditing(entry)}
                                  aria-label={t('visitorCounts.editFor', {
                                    store: storeText(entry),
                                    date: dateText,
                                  })}
                                  className="inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium text-emerald-600 transition hover:bg-emerald-400/10 dark:text-emerald-400"
                                >
                                  {t('visitorCounts.edit')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void remove(entry)}
                                  disabled={deleteMutation.isPending}
                                  aria-label={t('visitorCounts.deleteFor', {
                                    store: storeText(entry),
                                    date: dateText,
                                  })}
                                  title={t('visitorCounts.deleteFor', {
                                    store: storeText(entry),
                                    date: dateText,
                                  })}
                                  className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-red-500/10 hover:text-red-600 disabled:opacity-40 dark:hover:text-red-400"
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
      </div>

      {canEnter ? (
        <button
          type="button"
          onClick={() => setEditing('new')}
          aria-label={t('visitorCounts.add')}
          className="fixed bottom-6 right-6 z-20 inline-flex h-14 items-center gap-2 rounded-full bg-emerald-400 pl-4 pr-5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/40 transition hover:bg-emerald-300 active:scale-95 mb-[env(safe-area-inset-bottom)]"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M12 5v14M5 12h14" strokeLinecap="round" />
          </svg>
          {t('visitorCounts.add')}
        </button>
      ) : null}

      {importOpen ? (
        <VisitorCountImportModal
          storeId={filters.storeId}
          storeLabel={filteredStoreName}
          initialFrom={filters.from}
          initialTo={filters.to}
          onClose={() => setImportOpen(false)}
          onImported={() =>
            void queryClient.invalidateQueries({ queryKey: ['store-visitor-counts'] })
          }
        />
      ) : null}

      {editing !== null ? (
        <CountModal
          entry={editing === 'new' ? null : editing}
          initialStoreId={filters.storeId}
          onClose={() => setEditing(null)}
          onSaved={(saved) => void handleSaved(saved)}
        />
      ) : null}
    </AppShell>
  );
}
