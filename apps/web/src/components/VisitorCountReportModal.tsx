import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

import { getVisitorCountReport } from '../api/store-visitor-counts';
import { formatDate, formatNumber, formatShortDate } from '../i18n/formatters';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';
import type { VisitorCountReport } from '../types/api';
import { FormField, formInputClassName } from './FormField';
import { Modal } from './Modal';
import { StoreLookupField } from './StoreLookupField';

/** Longest range the API reports on (MAX_REPORT_DAYS). */
const MAX_REPORT_DAYS = 366;
/** Below this share of entered store-days the averages get a warning (conversion uses 80). */
const LOW_COVERAGE = 80;
const DAY_MS = 24 * 60 * 60 * 1000;

type Preset = 'thisWeek' | 'last10' | 'thisMonth' | 'lastMonth' | 'custom';

const PRESET_LABELS: Record<Preset, TranslationKey> = {
  thisWeek: 'visitorReport.rangeThisWeek',
  last10: 'visitorReport.rangeLast10',
  thisMonth: 'visitorReport.rangeThisMonth',
  lastMonth: 'visitorReport.rangeLastMonth',
  custom: 'visitorReport.rangeCustom',
};

const WEEKDAY_LABELS: Record<number, TranslationKey> = {
  1: 'visitorReport.weekdays.w1',
  2: 'visitorReport.weekdays.w2',
  3: 'visitorReport.weekdays.w3',
  4: 'visitorReport.weekdays.w4',
  5: 'visitorReport.weekdays.w5',
  6: 'visitorReport.weekdays.w6',
  7: 'visitorReport.weekdays.w7',
};

function isoDay(date: Date): string {
  return [
    String(date.getFullYear()),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

/** The preset's range in this device's calendar; weeks start on Monday. */
function presetRange(preset: Exclude<Preset, 'custom'>): { from: string; to: string } {
  const now = new Date();
  const today = isoDay(now);

  switch (preset) {
    case 'thisWeek': {
      const sinceMonday = (now.getDay() + 6) % 7;

      return { from: isoDay(new Date(now.getTime() - sinceMonday * DAY_MS)), to: today };
    }
    case 'last10':
      return { from: isoDay(new Date(now.getTime() - 9 * DAY_MS)), to: today };
    case 'thisMonth':
      return { from: isoDay(new Date(now.getFullYear(), now.getMonth(), 1)), to: today };
    case 'lastMonth':
      return {
        from: isoDay(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: isoDay(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
  }
}

function dayCount(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / DAY_MS) + 1;
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  hint,
  children,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
        {value}
      </p>
      {hint ? <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p> : null}
      {children}
    </div>
  );
}

function ChangeBadge({ change, days }: { change: number | null; days: number }) {
  const { t, locale } = useTranslation();

  if (change === null) {
    return (
      <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
        {t('visitorReport.noChange')}
      </p>
    );
  }

  const up = change >= 0;

  return (
    <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
      <span
        className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold tabular-nums ${
          up
            ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
            : 'bg-red-500/15 text-red-700 dark:text-red-300'
        }`}
      >
        <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3" fill="currentColor">
          <path d={up ? 'M6 2l4 5H2z' : 'M6 10L2 5h8z'} />
        </svg>
        {`${up ? '+' : ''}${formatNumber(change, locale)}%`}
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        {t('visitorReport.change', { days: String(days) })}
      </span>
    </p>
  );
}

/** One bar per day; a missing day is a dashed stub so it never reads as zero. */
function DailyChart({ report }: { report: VisitorCountReport }) {
  const { t, locale } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const days = report.days;
  const max = Math.max(1, ...days.map((day) => day.visitors ?? 0));
  const selectedDay = days.find((day) => day.date === selected) ?? null;
  const labelEvery = Math.max(1, Math.ceil(days.length / 6));

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t('visitorReport.dailyTitle')}
        </h3>
        <span className="text-[11px] tabular-nums text-slate-400">{formatNumber(max, locale)}</span>
      </div>
      <p
        className="mt-0.5 min-h-[18px] text-xs text-slate-600 dark:text-slate-300"
        aria-live="polite"
      >
        {selectedDay
          ? selectedDay.visitors === null
            ? t('visitorReport.dayMissing', { date: formatDate(selectedDay.date, locale) })
            : t('visitorReport.dayValue', {
                date: formatDate(selectedDay.date, locale),
                count: formatNumber(selectedDay.visitors, locale),
                stores: String(selectedDay.stores),
              })
          : t('visitorReport.dailyHint')}
      </p>

      <div
        role="group"
        aria-label={t('visitorReport.chartLabel', {
          from: formatDate(report.current.from, locale),
          to: formatDate(report.current.to, locale),
          total: formatNumber(report.current.visitors, locale),
        })}
        className="relative mt-2 flex h-40 items-end gap-[2px] border-b border-slate-200 dark:border-slate-700"
      >
        {/* Guide lines at a half and the top */}
        <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200 dark:border-slate-800" />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-800" />
        {days.map((day) => {
          const isSelected = day.date === selected;

          return (
            <button
              key={day.date}
              type="button"
              onClick={() => setSelected(isSelected ? null : day.date)}
              aria-label={
                day.visitors === null
                  ? t('visitorReport.dayMissing', { date: formatDate(day.date, locale) })
                  : t('visitorReport.dayValue', {
                      date: formatDate(day.date, locale),
                      count: formatNumber(day.visitors, locale),
                      stores: String(day.stores),
                    })
              }
              aria-pressed={isSelected}
              className="group relative flex h-full min-w-0 flex-1 items-end justify-center"
            >
              {day.visitors === null ? (
                <span className="block h-1.5 w-full rounded-sm border border-dashed border-slate-300 dark:border-slate-600" />
              ) : (
                <span
                  className={`block w-full rounded-t-sm transition ${
                    isSelected
                      ? 'bg-emerald-600 dark:bg-emerald-300'
                      : 'bg-emerald-400 group-hover:bg-emerald-500 dark:bg-emerald-500/80'
                  }`}
                  style={{ height: `${String(Math.max(2, (day.visitors / max) * 100))}%` }}
                />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex gap-[2px] text-[10px] text-slate-400">
        {days.map((day, index) => (
          <span key={day.date} className="min-w-0 flex-1 overflow-visible whitespace-nowrap">
            {index % labelEvery === 0 ? formatShortDate(day.date, locale) : ''}
          </span>
        ))}
      </div>
      <p className="mt-2 flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
          {t('visitorReport.people')}
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-slate-400" />
          {t('visitorReport.missing')}
        </span>
      </p>
    </section>
  );
}

function WeekdayChart({ report }: { report: VisitorCountReport }) {
  const { t, locale } = useTranslation();
  const max = Math.max(1, ...report.weekdays.map((day) => day.average ?? 0));
  let best: number | null = null;
  let bestAverage = -1;

  for (const day of report.weekdays) {
    if (day.average !== null && day.average > bestAverage) {
      best = day.weekday;
      bestAverage = day.average;
    }
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('visitorReport.weekdayTitle')}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {t('visitorReport.weekdayHint')}
      </p>
      <div className="mt-3 flex h-32 items-end gap-2">
        {report.weekdays.map((day) => (
          <div key={day.weekday} className="flex h-full min-w-0 flex-1 flex-col items-center">
            <span className="text-[10px] tabular-nums text-slate-500 dark:text-slate-400">
              {day.average === null ? '—' : formatNumber(Math.round(day.average), locale)}
            </span>
            <div className="flex w-full flex-1 items-end">
              <span
                className={`block w-full rounded-t-md ${
                  day.weekday === best
                    ? 'bg-emerald-500 dark:bg-emerald-400'
                    : 'bg-emerald-200 dark:bg-emerald-500/40'
                }`}
                style={{
                  height:
                    day.average === null
                      ? '0%'
                      : `${String(Math.max(3, (day.average / max) * 100))}%`,
                }}
              />
            </div>
            <span
              className={`mt-1 text-[11px] ${
                day.weekday === best
                  ? 'font-semibold text-emerald-700 dark:text-emerald-300'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {t(WEEKDAY_LABELS[day.weekday] ?? 'visitorReport.weekdays.w1')}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StoreRanking({ report }: { report: VisitorCountReport }) {
  const { t, locale } = useTranslation();
  const max = Math.max(1, ...report.stores.map((store) => store.visitors));
  const possibleDays =
    report.storeCount > 0 ? report.current.possibleStoreDays / report.storeCount : 0;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('visitorReport.storesTitle')}
      </h3>
      <ul className="mt-2 flex flex-col gap-3">
        {report.stores.map((store) => {
          const name = store.storeName
            ? `${String(store.storeNr)} · ${store.storeName}`
            : String(store.storeNr);

          return (
            <li key={store.storeId}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="min-w-0 truncate font-medium text-slate-700 dark:text-slate-200">
                  {name}
                </span>
                <span className="flex-shrink-0 tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                  {store.days === 0 ? (
                    <span className="font-normal text-slate-400">
                      {t('visitorReport.notEntered')}
                    </span>
                  ) : (
                    formatNumber(store.visitors, locale)
                  )}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <span
                  className="block h-full rounded-full bg-emerald-400 dark:bg-emerald-500"
                  style={{ width: `${String((store.visitors / max) * 100)}%` }}
                />
              </div>
              <p className="mt-0.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>
                  {t('visitorReport.storeDays', {
                    days: String(store.days),
                    possible: String(possibleDays),
                  })}
                </span>
                {store.average !== null ? (
                  <span className="tabular-nums">
                    {t('visitorReport.storeAverage', {
                      average: formatNumber(Math.round(store.average), locale),
                    })}
                  </span>
                ) : null}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Modal
// ---------------------------------------------------------------------------

interface VisitorCountReportModalProps {
  /** Store the list is filtered by; the report starts with it. */
  initialStoreId: number | undefined;
  onClose: () => void;
}

/**
 * Visitor count report (ADR-056): quick ranges (this week, last 10 days, this month, last
 * month) or custom dates, one store or all; summary cards, the daily chart, the weekday
 * pattern and the store ranking. Averages come from entered days only, and a low share of
 * entered days is called out so gaps are not mistaken for quiet days.
 */
export function VisitorCountReportModal({ initialStoreId, onClose }: VisitorCountReportModalProps) {
  const { t, locale } = useTranslation();
  const [preset, setPreset] = useState<Preset>('last10');
  const [custom, setCustom] = useState(() => presetRange('last10'));
  const [storeId, setStoreId] = useState<number | undefined>(initialStoreId);
  const range = preset === 'custom' ? custom : presetRange(preset);
  const today = isoDay(new Date());
  const rangeValid =
    range.from !== '' &&
    range.to !== '' &&
    range.from <= range.to &&
    range.to <= today &&
    dayCount(range.from, range.to) <= MAX_REPORT_DAYS;

  const reportQuery = useQuery({
    queryKey: ['store-visitor-counts', 'report', range.from, range.to, storeId],
    queryFn: () =>
      getVisitorCountReport({
        from: range.from,
        to: range.to,
        ...(storeId === undefined ? {} : { storeId }),
      }),
    enabled: rangeValid,
    placeholderData: keepPreviousData,
  });
  const report = reportQuery.data;
  const coverage =
    report && report.current.possibleStoreDays > 0
      ? Math.round((report.current.countedStoreDays / report.current.possibleStoreDays) * 100)
      : null;

  return (
    <Modal open onClose={onClose} title={t('visitorReport.title')} size="lg">
      <div className="flex flex-col gap-4">
        {/* Filters */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {(Object.keys(PRESET_LABELS) as Preset[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                if (key === 'custom' && preset !== 'custom') {
                  setCustom(range);
                }
                setPreset(key);
              }}
              aria-pressed={preset === key}
              className={`h-11 flex-shrink-0 rounded-full border px-4 text-sm font-medium transition ${
                preset === key
                  ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                  : 'border-slate-300 text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:text-slate-300'
              }`}
            >
              {t(PRESET_LABELS[key])}
            </button>
          ))}
        </div>

        {preset === 'custom' ? (
          <div className="grid grid-cols-2 gap-2">
            <FormField label={t('visitorReport.from')} htmlFor="visitor-report-from">
              <input
                id="visitor-report-from"
                type="date"
                value={custom.from}
                max={custom.to || today}
                onChange={(event) => setCustom((prev) => ({ ...prev, from: event.target.value }))}
                className={formInputClassName}
              />
            </FormField>
            <FormField label={t('visitorReport.to')} htmlFor="visitor-report-to">
              <input
                id="visitor-report-to"
                type="date"
                value={custom.to}
                min={custom.from || undefined}
                max={today}
                onChange={(event) => setCustom((prev) => ({ ...prev, to: event.target.value }))}
                className={formInputClassName}
              />
            </FormField>
          </div>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {`${formatDate(range.from, locale)} – ${formatDate(range.to, locale)}`}
          </p>
        )}

        <FormField label={t('visitorReport.store')} htmlFor="visitor-report-store">
          <StoreLookupField
            id="visitor-report-store"
            multiple={false}
            value={storeId === undefined ? [] : [storeId]}
            onChange={(ids) => setStoreId(ids[0])}
          />
        </FormField>

        {!rangeValid ? (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {t('visitorReport.errorRange')}
          </p>
        ) : reportQuery.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {t('visitorReport.error')}
          </p>
        ) : !report ? (
          <p className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('visitorReport.loading')}
          </p>
        ) : (
          <div
            className={`flex flex-col gap-3 transition-opacity ${reportQuery.isFetching ? 'opacity-60' : ''}`}
          >
            {/* Summary */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatCard
                label={t('visitorReport.totalVisitors')}
                value={formatNumber(report.current.visitors, locale)}
                hint={t('visitorReport.people')}
              />
              <StatCard
                label={t('visitorReport.dailyAverage')}
                value={
                  report.current.average === null
                    ? '—'
                    : formatNumber(Math.round(report.current.average), locale)
                }
                hint={t('visitorReport.perStoreDay')}
              >
                <ChangeBadge change={report.averageChange} days={report.days.length} />
              </StatCard>
              <StatCard
                label={t('visitorReport.coverage')}
                value={`${formatNumber(report.current.countedStoreDays, locale)} / ${formatNumber(
                  report.current.possibleStoreDays,
                  locale,
                )}`}
                hint={coverage === null ? undefined : `%${String(coverage)}`}
              />
              <StatCard
                label={t('visitorReport.busiestDay')}
                value={report.busiestDay ? formatNumber(report.busiestDay.visitors, locale) : '—'}
                hint={report.busiestDay ? formatDate(report.busiestDay.date, locale) : undefined}
              />
            </div>

            {coverage !== null && coverage < LOW_COVERAGE ? (
              <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                {t('visitorReport.coverageLow', { percent: String(coverage) })}
              </p>
            ) : null}

            {report.current.countedStoreDays === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                {t('visitorReport.empty')}
              </p>
            ) : (
              <>
                <DailyChart report={report} />
                <div className="grid gap-3 lg:grid-cols-2">
                  <WeekdayChart report={report} />
                  {report.storeCount > 1 ? <StoreRanking report={report} /> : null}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
