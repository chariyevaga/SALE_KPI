import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';

import { getStoreDashboard } from '../api/store-dashboard';
import { AppShell } from '../components/AppShell';
import { CalendarIcon, FilterSelect, StoreIcon } from '../components/FilterSelect';
import { formatDateTime, formatMonthName, formatNumber } from '../i18n/formatters';
import { pickLocalizedText } from '../i18n/localized-text';
import { useTranslation } from '../i18n/locale-store';
import type { Locale } from '../i18n/translations';
import type {
  StoreDashboardComparison,
  StoreDashboardKpi,
  StoreDashboardMonth,
  StoreDashboardResponse,
} from '../types/api';

type Currency = 'TMT' | 'USD';
type Store = StoreDashboardResponse['stores'][number];
type Translate = ReturnType<typeof useTranslation>['t'];

const CURRENCIES: Currency[] = ['TMT', 'USD'];
const PANEL_ID = 'store-dashboard-panel';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** "#1 Mağaza bazında ciro" → "#1" and the rest; KPI names carry their number (ADR-060). */
function splitCatalogName(name: string): { number: string | null; label: string } {
  const match = /^(#\d+)\s+(.+)$/.exec(name);

  return match?.[1] && match[2]
    ? { number: match[1], label: match[2] }
    : { number: null, label: name };
}

function monthName(month: number, locale: Locale, width: 'long' | 'short' = 'long'): string {
  const name = formatMonthName(month, locale, width);

  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

/** "Mart–Ağustos", or the short names when the months have a gap. */
function monthRange(months: readonly number[], locale: Locale): string {
  const first = months.at(0);
  const last = months.at(-1);

  if (first === undefined || last === undefined) {
    return '';
  }

  if (first === last) {
    return monthName(first, locale);
  }

  return last - first + 1 === months.length
    ? `${monthName(first, locale)}–${monthName(last, locale)}`
    : months.map((month) => monthName(month, locale, 'short')).join(', ');
}

function storeLabel(store: Store): string {
  return store.name ? `${String(store.nr)} · ${store.name}` : String(store.nr);
}

/** The comparison of one store (or all, `storeNr` null) in the chosen currency. */
function comparisonFor(
  kpi: StoreDashboardKpi,
  currency: Currency,
  storeNr: number | null,
): StoreDashboardComparison | null {
  const series =
    kpi.series.find((entry) => entry.currency === null || entry.currency === currency) ??
    kpi.series[0];

  if (!series) {
    return null;
  }

  return storeNr === null
    ? series.total
    : (series.stores.find((entry) => entry.storeNr === storeNr) ?? series.total);
}

/** Money with its currency; averages keep one decimal, everything else is whole. */
function formatValue(
  value: number | null,
  kpi: StoreDashboardKpi,
  currency: Currency,
  locale: Locale,
): string {
  if (value === null) {
    return '—';
  }

  const text = formatNumber(value, locale, {
    maximumFractionDigits: kpi.aggregation === 'average' ? 1 : 0,
  });

  return kpi.unit === 'money' ? `${text} ${currency}` : text;
}

function formatDifference(
  value: number,
  kpi: StoreDashboardKpi,
  currency: Currency,
  locale: Locale,
): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  return sign + formatValue(Math.abs(value), kpi, currency, locale);
}

function formatGrowth(value: number, locale: Locale, t: Translate, digits = 1): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';

  return (
    sign +
    t('storeDashboard.percent', {
      value: formatNumber(Math.abs(value), locale, { maximumFractionDigits: digits }),
    })
  );
}

function growthTone(value: number | null): string {
  if (value === null || value === 0) {
    return 'text-slate-500 dark:text-slate-400';
  }

  return value > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
}

function barHeight(value: number | null, max: number): string {
  return value === null || value <= 0 ? '0%' : `${String(Math.max(3, (value / max) * 100))}%`;
}

function chartMax(months: readonly StoreDashboardMonth[]): number {
  return Math.max(1, ...months.flatMap((month) => [month.current ?? 0, month.previous ?? 0]));
}

// ---------------------------------------------------------------------------
// Pieces
// ---------------------------------------------------------------------------

function TrendArrow({ up, className = '' }: { up: boolean; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className={className} fill="currentColor">
      <path d={up ? 'M6 2l4 5H2z' : 'M6 10L2 5h8z'} />
    </svg>
  );
}

function ChevronRightIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

/** A growth pill; `compact` shows nothing when there is no comparison. */
function GrowthBadge({ value, compact = false }: { value: number | null; compact?: boolean }) {
  const { t, locale } = useTranslation();

  if (value === null) {
    return compact ? null : (
      <span className="text-xs text-slate-400 dark:text-slate-500">
        {t('storeDashboard.noGrowth')}
      </span>
    );
  }

  const tone =
    value > 0
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : value < 0
        ? 'bg-red-500/15 text-red-700 dark:text-red-300'
        : 'bg-slate-500/15 text-slate-600 dark:text-slate-300';

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${tone}`}
    >
      {value === 0 ? null : <TrendArrow up={value > 0} className="h-3 w-3" />}
      {formatGrowth(value, locale, t)}
    </span>
  );
}

/** The one big number of a KPI: how much it grew. */
function GrowthHeadline({ value, large = false }: { value: number | null; large?: boolean }) {
  const { t, locale } = useTranslation();

  if (value === null) {
    return (
      <p className="text-lg font-semibold text-slate-400 dark:text-slate-500">
        {t('storeDashboard.noGrowth')}
      </p>
    );
  }

  return (
    <p
      className={`flex items-center gap-1.5 font-bold tabular-nums ${growthTone(value)} ${
        large ? 'text-4xl sm:text-5xl' : 'text-3xl'
      }`}
    >
      {value === 0 ? null : <TrendArrow up={value > 0} className={large ? 'h-7 w-7' : 'h-5 w-5'} />}
      {formatGrowth(value, locale, t)}
    </p>
  );
}

function NumberChip({ number }: { number: string }) {
  return (
    <span className="flex-shrink-0 rounded-md bg-emerald-600 px-1.5 py-0.5 text-xs font-bold text-white dark:bg-emerald-400 dark:text-slate-950">
      {number}
    </span>
  );
}

function Legend({ year, previousYear }: { year: number; previousYear: number }) {
  const { t } = useTranslation();

  return (
    <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-slate-300 dark:bg-slate-600" />
        {previousYear}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500 dark:bg-emerald-400" />
        {year}
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-emerald-500 bg-emerald-500/25" />
        {t('storeDashboard.inProgressShort')}
      </span>
    </p>
  );
}

/** Twelve pairs of bars, last year grey and this year green; for the summary cards. */
function MiniBars({ months }: { months: readonly StoreDashboardMonth[] }) {
  const max = chartMax(months);

  return (
    <span aria-hidden="true" className="flex h-10 items-end gap-[3px]">
      {months.map((month) => (
        <span key={month.month} className="flex h-full min-w-0 flex-1 items-end gap-px">
          <span
            className="block w-1/2 rounded-t-sm bg-slate-300 dark:bg-slate-600"
            style={{ height: barHeight(month.previous, max) }}
          />
          <span
            className={`block w-1/2 rounded-t-sm ${
              month.status === 'inProgress'
                ? 'bg-emerald-300 dark:bg-emerald-700'
                : 'bg-emerald-500 dark:bg-emerald-400'
            }`}
            style={{ height: barHeight(month.current, max) }}
          />
        </span>
      ))}
    </span>
  );
}

/** Growth as a bar from a centre line: right and green for growth, left and red for decline. */
function DivergingBar({ value, maxAbs }: { value: number | null; maxAbs: number }) {
  return (
    <span className="relative mt-1.5 block h-2 rounded-full bg-slate-100 dark:bg-slate-800">
      <span className="absolute inset-y-0 left-1/2 w-px bg-slate-300 dark:bg-slate-600" />
      {value === null || value === 0 ? null : (
        <span
          className={`absolute inset-y-0 rounded-full ${
            value > 0 ? 'left-1/2 bg-emerald-500' : 'right-1/2 bg-red-500'
          }`}
          style={{ width: `${String(Math.min(50, (Math.abs(value) / maxAbs) * 50))}%` }}
        />
      )}
    </span>
  );
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
    >
      {children}
    </section>
  );
}

/** What the two values of a card stand for: the compared months, or each year on its own. */
function yearLabels(
  comparison: StoreDashboardComparison,
  year: number,
  previousYear: number,
  t: Translate,
): {
  current: string;
  previous: string;
  currentValue: number | null;
  previousValue: number | null;
} {
  const { summary } = comparison;

  return summary.comparableMonths.length > 0
    ? {
        current: String(year),
        previous: String(previousYear),
        currentValue: summary.current,
        previousValue: summary.previous,
      }
    : {
        current: t('storeDashboard.yearSoFar', { year, count: summary.currentYearMonths }),
        previous: t('storeDashboard.previousYearAll', {
          year: previousYear,
          count: summary.previousYearMonths,
        }),
        currentValue: summary.currentYearValue,
        previousValue: summary.previousYearValue,
      };
}

// ---------------------------------------------------------------------------
// Summary tab
// ---------------------------------------------------------------------------

function KpiSummaryCard({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
  onOpen,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
  onOpen: () => void;
}) {
  const { t, locale } = useTranslation();
  const name = pickLocalizedText(kpi.name, locale);
  const { number, label } = splitCatalogName(name);
  const labels = yearLabels(comparison, year, previousYear, t);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={t('storeDashboard.openKpi', { name })}
      className="flex min-h-[44px] flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-emerald-400 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40 dark:border-slate-800 dark:bg-slate-900"
    >
      <span className="flex items-start gap-2">
        {number ? <NumberChip number={number} /> : null}
        <span className="min-w-0 flex-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
          {label}
        </span>
        <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-slate-400" />
      </span>
      <GrowthHeadline value={comparison.summary.growthPercent} />
      <span className="grid grid-cols-2 gap-2 text-xs">
        <span className="min-w-0">
          <span className="block truncate text-slate-500 dark:text-slate-400">
            {labels.current}
          </span>
          <span className="block truncate font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {formatValue(labels.currentValue, kpi, currency, locale)}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block truncate text-slate-500 dark:text-slate-400">
            {labels.previous}
          </span>
          <span className="block truncate font-semibold tabular-nums text-slate-600 dark:text-slate-300">
            {formatValue(labels.previousValue, kpi, currency, locale)}
          </span>
        </span>
      </span>
      <MiniBars months={comparison.months} />
      {kpi.aggregation === 'average' ? (
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.monthlyAverage')}
        </span>
      ) : null}
    </button>
  );
}

/** Every store against every KPI: where the growth came from. */
function StoreMatrix({
  data,
  currency,
  onOpen,
}: {
  data: StoreDashboardResponse;
  currency: Currency;
  onOpen: (code: string, storeNr: number) => void;
}) {
  const { t, locale } = useTranslation();
  const kpis = data.kpis.map((kpi) => ({
    kpi,
    name: pickLocalizedText(kpi.name, locale),
    number: splitCatalogName(pickLocalizedText(kpi.name, locale)).number,
  }));
  const growthOf = (kpi: StoreDashboardKpi, storeNr: number) =>
    comparisonFor(kpi, currency, storeNr)?.summary.growthPercent ?? null;

  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.storesTitle')}
      </h2>
      {data.stores.length === 1 ? (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {t('storeDashboard.singleStore')}
        </p>
      ) : null}

      {/* Mobile and tablet: a card per store */}
      <ul className="mt-3 flex flex-col gap-3 lg:hidden">
        {data.stores.map((store) => (
          <li
            key={store.nr}
            className="rounded-xl border border-slate-200 p-3 dark:border-slate-800"
          >
            <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {storeLabel(store)}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {kpis.map(({ kpi, name, number }) => (
                <button
                  key={kpi.code}
                  type="button"
                  onClick={() => onOpen(kpi.code, store.nr)}
                  aria-label={t('storeDashboard.openKpi', {
                    name: `${storeLabel(store)} · ${name}`,
                  })}
                  className="flex min-h-[44px] items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 text-left transition hover:bg-emerald-500/10 dark:bg-slate-800/60"
                >
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {number ?? name}
                  </span>
                  <GrowthBadge value={growthOf(kpi, store.nr)} compact />
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: one table */}
      <div className="mt-3 hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2 pr-3 font-medium">{t('storeDashboard.store')}</th>
              {kpis.map(({ kpi, name, number }) => (
                <th key={kpi.code} className="px-2 py-2 font-medium" title={name}>
                  {number ?? name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.stores.map((store) => (
              <tr key={store.nr} className="border-b border-slate-100 dark:border-slate-800/60">
                <td className="max-w-[16rem] truncate py-2 pr-3 font-medium text-slate-800 dark:text-slate-100">
                  {storeLabel(store)}
                </td>
                {kpis.map(({ kpi, name }) => (
                  <td key={kpi.code} className="px-1 py-1">
                    <button
                      type="button"
                      onClick={() => onOpen(kpi.code, store.nr)}
                      aria-label={t('storeDashboard.openKpi', {
                        name: `${storeLabel(store)} · ${name}`,
                      })}
                      className="flex min-h-[44px] w-full items-center rounded-lg px-1 transition hover:bg-emerald-500/10"
                    >
                      <GrowthBadge value={growthOf(kpi, store.nr)} />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SummaryTab({
  data,
  currency,
  storeNr,
  onOpen,
}: {
  data: StoreDashboardResponse;
  currency: Currency;
  storeNr: number | null;
  onOpen: (code: string, storeNr?: number) => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => {
          const comparison = comparisonFor(kpi, currency, storeNr);

          return comparison ? (
            <KpiSummaryCard
              key={kpi.code}
              kpi={kpi}
              comparison={comparison}
              currency={currency}
              year={data.year}
              previousYear={data.previousYear}
              onOpen={() => onOpen(kpi.code)}
            />
          ) : null;
        })}
      </div>
      {storeNr === null && data.stores.length > 0 ? (
        <StoreMatrix data={data} currency={currency} onOpen={onOpen} />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI tab
// ---------------------------------------------------------------------------

function StatBox({ label, value, tone = '' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-base font-semibold tabular-nums text-slate-900 dark:text-slate-100 sm:text-lg ${tone}`}
      >
        {value}
      </p>
    </div>
  );
}

function KpiHeader({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
}) {
  const { t, locale } = useTranslation();
  const { number, label } = splitCatalogName(pickLocalizedText(kpi.name, locale));
  const { summary } = comparison;
  const labels = yearLabels(comparison, year, previousYear, t);

  return (
    <Card>
      <div className="flex items-start gap-2">
        {number ? <NumberChip number={number} /> : null}
        <h2 className="min-w-0 flex-1 text-base font-semibold text-slate-900 dark:text-slate-100">
          {label}
        </h2>
      </div>
      <p className="mt-3 text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t('storeDashboard.growth')}
      </p>
      <GrowthHeadline value={summary.growthPercent} large />
      {summary.comparableMonths.length > 0 ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {t('storeDashboard.comparedMonths', {
            range: monthRange(summary.comparableMonths, locale),
            count: summary.comparableMonths.length,
          })}
        </p>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        <StatBox
          label={labels.current}
          value={formatValue(labels.currentValue, kpi, currency, locale)}
        />
        <StatBox
          label={labels.previous}
          value={formatValue(labels.previousValue, kpi, currency, locale)}
          tone="!text-slate-600 dark:!text-slate-300"
        />
        {summary.difference === null ? null : (
          <StatBox
            label={t('storeDashboard.difference')}
            value={formatDifference(summary.difference, kpi, currency, locale)}
            tone={growthTone(summary.difference)}
          />
        )}
      </div>
      {kpi.aggregation === 'average' ? (
        <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.monthlyAverage')}
        </p>
      ) : null}
    </Card>
  );
}

function MonthlyChart({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
}) {
  const { t, locale } = useTranslation();
  const [selected, setSelected] = useState<number | null>(null);
  const months = comparison.months;
  const max = chartMax(months);
  const selectedMonth = months.find((month) => month.month === selected) ?? null;
  const value = (amount: number | null) => formatValue(amount, kpi, currency, locale);

  return (
    <Card className="!p-3 sm:!p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          {t('storeDashboard.monthlyTitle')}
        </h3>
        <Legend year={year} previousYear={previousYear} />
      </div>
      <div
        aria-live="polite"
        className="mt-1 flex min-h-[24px] flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600 dark:text-slate-300"
      >
        {selectedMonth ? (
          <>
            <span className="font-semibold">{monthName(selectedMonth.month, locale)}</span>
            <span className="tabular-nums">{`${String(year)}: ${value(selectedMonth.current)}`}</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {`${String(previousYear)}: ${value(selectedMonth.previous)}`}
            </span>
            {selectedMonth.status === 'inProgress' ? (
              <span className="text-slate-500">{t('storeDashboard.inProgressShort')}</span>
            ) : (
              <GrowthBadge value={selectedMonth.growthPercent} />
            )}
          </>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">
            {t('storeDashboard.monthlyHint')}
          </span>
        )}
      </div>

      <div className="relative mt-2 flex h-44 items-end gap-1 border-b border-slate-200 dark:border-slate-700 sm:h-56 sm:gap-2">
        <span className="pointer-events-none absolute inset-x-0 top-0 border-t border-dashed border-slate-200 dark:border-slate-800" />
        <span className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-dashed border-slate-200 dark:border-slate-800" />
        {months.map((month) => {
          const isSelected = month.month === selected;

          return (
            <button
              key={month.month}
              type="button"
              onClick={() => setSelected(isSelected ? null : month.month)}
              aria-pressed={isSelected}
              aria-label={t('storeDashboard.monthAria', {
                month: monthName(month.month, locale),
                year,
                current: value(month.current),
                previousYear,
                previous: value(month.previous),
              })}
              className={`group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px rounded-t-md transition ${
                isSelected ? 'bg-emerald-500/10' : 'hover:bg-slate-500/5'
              }`}
            >
              <span
                className="block w-[45%] rounded-t-sm bg-slate-300 dark:bg-slate-600"
                style={{ height: barHeight(month.previous, max) }}
              />
              <span
                className={`block w-[45%] rounded-t-sm ${
                  month.status === 'inProgress'
                    ? 'border border-dashed border-emerald-500 bg-emerald-500/25'
                    : 'bg-emerald-500 group-hover:bg-emerald-600 dark:bg-emerald-400'
                }`}
                style={{ height: barHeight(month.current, max) }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-1 flex gap-1 sm:gap-2">
        {months.map((month) => (
          <span key={month.month} className="min-w-0 flex-1 text-center">
            <span className="block truncate text-[10px] text-slate-500 dark:text-slate-400">
              {monthName(month.month, locale, 'short')}
            </span>
            {/* Too tight on a phone; the list below carries the same numbers. */}
            <span
              className={`hidden truncate text-[10px] font-semibold tabular-nums sm:block ${growthTone(month.growthPercent)}`}
            >
              {month.growthPercent === null ? ' ' : formatGrowth(month.growthPercent, locale, t, 0)}
            </span>
          </span>
        ))}
      </div>
    </Card>
  );
}

function MonthlyTable({
  kpi,
  comparison,
  currency,
  year,
  previousYear,
}: {
  kpi: StoreDashboardKpi;
  comparison: StoreDashboardComparison;
  currency: Currency;
  year: number;
  previousYear: number;
}) {
  const { t, locale } = useTranslation();
  // A month with no value in either year has nothing to show; the running one always shows.
  const months = comparison.months.filter(
    (month) => month.status === 'inProgress' || month.current !== null || month.previous !== null,
  );
  const value = (amount: number | null) => formatValue(amount, kpi, currency, locale);
  const difference = (month: StoreDashboardMonth) =>
    month.status === 'complete' && month.current !== null && month.previous !== null
      ? month.current - month.previous
      : null;
  const inProgressChip = (
    <span className="ml-1.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
      {t('storeDashboard.inProgressShort')}
    </span>
  );

  return (
    <Card className="!p-0">
      {/* Mobile and tablet: a row per month */}
      <ul className="divide-y divide-slate-100 dark:divide-slate-800 lg:hidden">
        {months.map((month) => (
          <li
            key={month.month}
            className={`flex items-center gap-3 px-4 py-2.5 ${
              month.status === 'upcoming' ? 'opacity-60' : ''
            }`}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                {monthName(month.month, locale)}
                {month.status === 'inProgress' ? inProgressChip : null}
              </p>
              <p className="truncate text-xs tabular-nums text-slate-500 dark:text-slate-400">
                {`${String(year)}: ${value(month.current)} · ${String(previousYear)}: ${value(month.previous)}`}
              </p>
            </div>
            <GrowthBadge value={month.growthPercent} compact />
          </li>
        ))}
      </ul>

      {/* Desktop: a table */}
      <table className="hidden w-full text-sm lg:table">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
            <th className="px-4 py-2 font-medium">{t('storeDashboard.month')}</th>
            <th className="px-4 py-2 text-right font-medium">{previousYear}</th>
            <th className="px-4 py-2 text-right font-medium">{year}</th>
            <th className="px-4 py-2 text-right font-medium">{t('storeDashboard.difference')}</th>
            <th className="px-4 py-2 text-right font-medium">{t('storeDashboard.change')}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => {
            const change = difference(month);

            return (
              <tr
                key={month.month}
                className={`border-b border-slate-100 last:border-0 dark:border-slate-800/60 ${
                  month.status === 'upcoming' ? 'opacity-60' : ''
                }`}
              >
                <td className="px-4 py-2 font-medium text-slate-800 dark:text-slate-100">
                  {monthName(month.month, locale)}
                  {month.status === 'inProgress' ? inProgressChip : null}
                </td>
                <td className="px-4 py-2 text-right tabular-nums text-slate-600 dark:text-slate-300">
                  {value(month.previous)}
                </td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                  {value(month.current)}
                </td>
                <td className={`px-4 py-2 text-right tabular-nums ${growthTone(change)}`}>
                  {change === null ? '—' : formatDifference(change, kpi, currency, locale)}
                </td>
                <td className="px-4 py-2 text-right">
                  <GrowthBadge value={month.growthPercent} compact />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

/** The stores of one KPI ranked by growth, each with a bar from the centre line. */
function StoreRanking({
  data,
  kpi,
  currency,
  onSelect,
}: {
  data: StoreDashboardResponse;
  kpi: StoreDashboardKpi;
  currency: Currency;
  onSelect: (storeNr: number) => void;
}) {
  const { t, locale } = useTranslation();
  const entries = data.stores
    .map((store) => ({ store, comparison: comparisonFor(kpi, currency, store.nr) }))
    .flatMap(({ store, comparison }) => (comparison ? [{ store, comparison }] : []))
    .sort((left, right) => {
      const a = left.comparison.summary.growthPercent;
      const b = right.comparison.summary.growthPercent;

      if (a === null || b === null) {
        return a === b ? 0 : a === null ? 1 : -1;
      }

      return b - a;
    });
  const maxAbs = Math.max(
    1,
    ...entries.map((entry) => Math.abs(entry.comparison.summary.growthPercent ?? 0)),
  );

  return (
    <Card>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        {t('storeDashboard.storesTitle')}
      </h3>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        {data.stores.length === 1
          ? t('storeDashboard.singleStore')
          : t('storeDashboard.storesHint')}
      </p>
      <ul className="mt-2 flex flex-col">
        {entries.map(({ store, comparison }) => {
          // The years alone: the header already says which months the values cover.
          const { currentValue, previousValue } = yearLabels(
            comparison,
            data.year,
            data.previousYear,
            t,
          );

          return (
            <li key={store.nr}>
              <button
                type="button"
                onClick={() => onSelect(store.nr)}
                className="block min-h-[44px] w-full rounded-lg px-2 py-2 text-left transition hover:bg-slate-500/5"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                    {storeLabel(store)}
                  </span>
                  <GrowthBadge value={comparison.summary.growthPercent} />
                </span>
                <DivergingBar value={comparison.summary.growthPercent} maxAbs={maxAbs} />
                <span className="mt-1 block truncate text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                  {`${String(data.year)}: ${formatValue(currentValue, kpi, currency, locale)} · ${String(data.previousYear)}: ${formatValue(previousValue, kpi, currency, locale)}`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function KpiTab({
  data,
  kpi,
  currency,
  storeNr,
  onSelectStore,
}: {
  data: StoreDashboardResponse;
  kpi: StoreDashboardKpi;
  currency: Currency;
  storeNr: number | null;
  onSelectStore: (storeNr: number) => void;
}) {
  const { t } = useTranslation();
  const comparison = comparisonFor(kpi, currency, storeNr);

  if (!comparison) {
    return null;
  }

  const props = { kpi, comparison, currency, year: data.year, previousYear: data.previousYear };

  return (
    <div className="flex flex-col gap-4">
      <KpiHeader {...props} />
      {/* Keyed by the store and currency, so the selected month resets with them. */}
      <MonthlyChart key={`${String(storeNr)}-${currency}`} {...props} />
      <div className="grid gap-4 lg:grid-cols-5">
        <div
          className={storeNr === null && data.stores.length > 0 ? 'lg:col-span-3' : 'lg:col-span-5'}
        >
          <MonthlyTable {...props} />
        </div>
        {storeNr === null && data.stores.length > 0 ? (
          <div className="lg:col-span-2">
            <StoreRanking data={data} kpi={kpi} currency={currency} onSelect={onSelectStore} />
          </div>
        ) : null}
      </div>
      {storeNr === null && data.stores.length > 1 && kpi.aggregation === 'average' ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          {t('storeDashboard.customersNote')}
        </p>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

function TabButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={PANEL_ID}
      aria-label={label}
      title={label}
      onClick={onClick}
      className={`flex min-h-[44px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition ${
        active
          ? 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950'
          : 'border-slate-300 bg-white text-slate-700 hover:border-emerald-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
      }`}
    >
      {children}
    </button>
  );
}

function FreshnessLine({ refresh }: { refresh: StoreDashboardResponse['refresh'] }) {
  const { t, locale } = useTranslation();

  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
      <span
        aria-hidden="true"
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          refresh.intervalMinutes > 0 ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
        }`}
      />
      <span>
        {refresh.intervalMinutes > 0
          ? t('storeDashboard.refreshEvery', {
              minutes: formatNumber(refresh.intervalMinutes, locale),
            })
          : t('storeDashboard.refreshOff')}
      </span>
      {refresh.lastRunAt ? (
        <span>
          · {t('storeDashboard.updatedAt', { at: formatDateTime(refresh.lastRunAt, locale) })}
        </span>
      ) : null}
    </p>
  );
}

/** The summary line under the filters: which years, which months, what is left out. */
function ComparisonNotes({
  data,
  currency,
  storeNr,
}: {
  data: StoreDashboardResponse;
  currency: Currency;
  storeNr: number | null;
}) {
  const { t, locale } = useTranslation();
  const first = data.kpis[0];
  const comparable = first
    ? (comparisonFor(first, currency, storeNr)?.summary.comparableMonths ?? [])
    : [];
  const [currentYear, currentMonth] = data.currentMonth.split('-').map(Number);
  const running = currentYear === data.year && currentMonth !== undefined ? currentMonth : null;

  return (
    <section className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 p-4 text-white dark:from-emerald-500/25 dark:to-emerald-500/5 dark:text-emerald-50">
      <h2 className="text-lg font-bold">
        {t('storeDashboard.comparing', { year: data.year, previous: data.previousYear })}
      </h2>
      <p className="mt-1 text-sm text-emerald-50/90">
        {comparable.length > 0
          ? t('storeDashboard.comparedMonths', {
              range: monthRange(comparable, locale),
              count: comparable.length,
            })
          : t('storeDashboard.noComparison', { year: data.year, previous: data.previousYear })}
      </p>
      {running !== null ? (
        <p className="mt-1 text-xs text-emerald-50/80">
          {t('storeDashboard.inProgress', { month: monthName(running, locale) })}
        </p>
      ) : null}
    </section>
  );
}

/**
 * Store dashboard (ADR-061), full access only: the store KPIs #1–#6 of a calendar year
 * against the year before, month by month. The summary tab shows how much each KPI grew and
 * where (store by store); each KPI tab has the monthly chart, the month list and the store
 * ranking. Growth is measured over finished months that have values in both years. Year,
 * store, currency and tab live in the URL (`?year=&store=&currency=&tab=`).
 */
export function StoreDashboardPage() {
  const { t, locale } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const yearParam = Number(searchParams.get('year'));
  const year = Number.isInteger(yearParam) && yearParam >= 2000 ? yearParam : undefined;
  const storeParam = searchParams.get('store');
  const requestedStore =
    storeParam !== null && /^\d+$/.test(storeParam) ? Number(storeParam) : null;
  const currency: Currency = searchParams.get('currency') === 'USD' ? 'USD' : 'TMT';
  const tabParam = searchParams.get('tab');

  const query = useQuery({
    queryKey: ['store-dashboard', year ?? null],
    queryFn: () => getStoreDashboard(year),
    placeholderData: keepPreviousData,
  });
  const data = query.data;
  const storeNr =
    requestedStore !== null && data?.stores.some((store) => store.nr === requestedStore)
      ? requestedStore
      : null;
  const activeKpi = data?.kpis.find((kpi) => kpi.code === tabParam) ?? null;
  const showCurrency = activeKpi === null || activeKpi.unit === 'money';

  function update(next: {
    year?: number | undefined;
    store?: number | null;
    currency?: Currency;
    tab?: string | null;
  }) {
    const params: Record<string, string> = {};
    const nextYear = 'year' in next ? next.year : year;
    const nextStore = 'store' in next ? next.store : storeNr;
    const nextCurrency = next.currency ?? currency;
    const nextTab = 'tab' in next ? next.tab : (activeKpi?.code ?? null);

    if (nextYear !== undefined) {
      params.year = String(nextYear);
    }

    if (nextStore !== null && nextStore !== undefined) {
      params.store = String(nextStore);
    }

    if (nextCurrency !== 'TMT') {
      params.currency = nextCurrency;
    }

    if (nextTab) {
      params.tab = nextTab;
    }

    setSearchParams(params, { replace: true });
  }

  function openKpi(code: string, store?: number) {
    update(store === undefined ? { tab: code } : { tab: code, store });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <AppShell title={t('storeDashboard.title')} fullWidth>
      <div className="mx-auto w-full max-w-6xl px-4">
        {data ? (
          <div className="mb-4 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
              <FilterSelect
                id="store-dashboard-year"
                label={t('storeDashboard.year')}
                icon={<CalendarIcon className="h-4 w-4" />}
                value={String(data.year)}
                onChange={(value) => update({ year: Number(value) })}
              >
                {data.years.map((option) => (
                  <option key={option} value={option}>
                    {t('storeDashboard.yearOption', { year: option, previous: option - 1 })}
                  </option>
                ))}
              </FilterSelect>
              <FilterSelect
                id="store-dashboard-store"
                label={t('storeDashboard.store')}
                icon={<StoreIcon className="h-4 w-4" />}
                value={storeNr === null ? '' : String(storeNr)}
                onChange={(value) => update({ store: value === '' ? null : Number(value) })}
              >
                <option value="">{t('storeDashboard.allStores')}</option>
                {data.stores.map((store) => (
                  <option key={store.nr} value={store.nr}>
                    {storeLabel(store)}
                  </option>
                ))}
              </FilterSelect>
              {showCurrency ? (
                <div
                  role="group"
                  aria-label={t('storeDashboard.currency')}
                  className="col-span-2 flex h-11 w-full rounded-full border border-slate-300 bg-white p-1 dark:border-slate-700 dark:bg-slate-900 sm:w-auto"
                >
                  {CURRENCIES.map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={currency === option}
                      onClick={() => update({ currency: option })}
                      className={`flex-1 rounded-full px-4 text-sm font-semibold transition sm:flex-none ${
                        currency === option
                          ? 'bg-emerald-600 text-white dark:bg-emerald-400 dark:text-slate-950'
                          : 'text-slate-600 hover:text-emerald-600 dark:text-slate-300'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <FreshnessLine refresh={data.refresh} />
          </div>
        ) : null}

        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('storeDashboard.loading')}
          </p>
        ) : null}

        {query.isError ? (
          <p
            role="alert"
            className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
          >
            {t('storeDashboard.error')}
          </p>
        ) : null}

        {data && data.stores.length === 0 && !query.isPlaceholderData ? (
          <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
            {t('storeDashboard.empty')}
          </p>
        ) : null}

        {data && data.stores.length > 0 ? (
          <div
            aria-busy={query.isPlaceholderData}
            className={`flex flex-col gap-4 transition-opacity ${
              query.isPlaceholderData ? 'opacity-60' : ''
            }`}
          >
            <div
              role="tablist"
              aria-label={t('storeDashboard.tabs')}
              className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
            >
              <TabButton
                active={activeKpi === null}
                onClick={() => update({ tab: null })}
                label={t('storeDashboard.summaryTab')}
              >
                {t('storeDashboard.summaryTab')}
              </TabButton>
              {data.kpis.map((kpi) => {
                const name = pickLocalizedText(kpi.name, locale);
                const { number, label } = splitCatalogName(name);
                const growth = comparisonFor(kpi, currency, storeNr)?.summary.growthPercent ?? null;

                return (
                  <TabButton
                    key={kpi.code}
                    active={activeKpi?.code === kpi.code}
                    onClick={() => update({ tab: kpi.code })}
                    label={name}
                  >
                    <span className="font-bold">{number ?? label}</span>
                    {number ? <span className="hidden xl:inline">{label}</span> : null}
                    <GrowthBadge value={growth} compact />
                  </TabButton>
                );
              })}
            </div>

            <div id={PANEL_ID} role="tabpanel" className="flex flex-col gap-4">
              <ComparisonNotes data={data} currency={currency} storeNr={storeNr} />
              {activeKpi ? (
                <KpiTab
                  key={activeKpi.code}
                  data={data}
                  kpi={activeKpi}
                  currency={currency}
                  storeNr={storeNr}
                  onSelectStore={(nr) => update({ store: nr })}
                />
              ) : (
                <SummaryTab data={data} currency={currency} storeNr={storeNr} onOpen={openKpi} />
              )}
            </div>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}
