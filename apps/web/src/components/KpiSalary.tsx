import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { formatMonth, formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import type { KpiPlanSalary, KpiResult, SalaryCurrency } from '../types/api';

/** How long salary figures stay visible after a tap. */
const REVEAL_MS = 20_000;

// ---------------------------------------------------------------------------
// Reveal state: one tap shows every figure of the view for twenty seconds
// ---------------------------------------------------------------------------

interface RevealState {
  revealed: boolean;
  secondsLeft: number;
  reveal: () => void;
  hide: () => void;
}

const RevealContext = createContext<RevealState | null>(null);

/**
 * Salary figures are blurred so nobody reads them over the owner's shoulder (ADR-049). A tap
 * shows every figure inside this provider for twenty seconds, then they blur again on their
 * own. While hidden the real numbers are not in the page at all.
 */
export function SalaryRevealProvider({ children }: { children: ReactNode }) {
  const [revealedUntil, setRevealedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (revealedUntil === null) return;

    const timer = window.setInterval(() => {
      const current = Date.now();

      setNow(current);

      if (current >= revealedUntil) {
        setRevealedUntil(null);
      }
    }, 250);

    return () => window.clearInterval(timer);
  }, [revealedUntil]);

  const reveal = useCallback(() => {
    const current = Date.now();

    setNow(current);
    setRevealedUntil(current + REVEAL_MS);
  }, []);
  const hide = useCallback(() => setRevealedUntil(null), []);
  const revealed = revealedUntil !== null && now < revealedUntil;
  const value = useMemo(
    () => ({
      revealed,
      secondsLeft: revealed ? Math.max(1, Math.ceil((revealedUntil - now) / 1000)) : 0,
      reveal,
      hide,
    }),
    [revealed, revealedUntil, now, reveal, hide],
  );

  return <RevealContext.Provider value={value}>{children}</RevealContext.Provider>;
}

function useReveal(): RevealState {
  const state = useContext(RevealContext);

  if (!state) {
    throw new Error('Salary figures must sit inside SalaryRevealProvider.');
  }

  return state;
}

function money(
  value: number,
  currency: SalaryCurrency,
  locale: Parameters<typeof formatNumber>[1],
) {
  return `${formatNumber(value, locale)} ${currency}`;
}

/** A salary figure: the number while revealed, a blurred stand-in otherwise. */
export function SecretAmount({
  value,
  currency,
  className = '',
}: {
  value: number;
  currency: SalaryCurrency;
  className?: string;
}) {
  const { t, locale } = useTranslation();
  const { revealed, reveal } = useReveal();

  if (revealed) {
    return <span className={`tabular-nums ${className}`}>{money(value, currency, locale)}</span>;
  }

  return (
    <button
      type="button"
      onClick={reveal}
      aria-label={t('kpiSalary.hidden')}
      className={`inline-flex rounded-md align-baseline tabular-nums ${className}`}
    >
      {/* A fixed stand-in, so the blur never hints at the real number. */}
      <span aria-hidden="true" className="select-none blur-[6px]">
        {money(88_888, currency, locale)}
      </span>
    </button>
  );
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
      {open ? null : <path d="M4 4l16 16" />}
    </svg>
  );
}

/** "Show" / "Hide · 4": the explicit switch next to the salary title. */
export function RevealToggle() {
  const { t } = useTranslation();
  const { revealed, secondsLeft, reveal, hide } = useReveal();

  return (
    <button
      type="button"
      onClick={revealed ? hide : reveal}
      aria-pressed={revealed}
      className={`inline-flex min-h-[44px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-3 text-xs font-semibold tabular-nums transition ${
        revealed
          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
          : 'border-slate-300 text-slate-600 hover:border-emerald-400 dark:border-slate-700 dark:text-slate-300'
      }`}
    >
      <EyeIcon open={!revealed} />
      {revealed ? t('kpiSalary.hide', { seconds: String(secondsLeft) }) : t('kpiSalary.show')}
    </button>
  );
}

// ---------------------------------------------------------------------------
// The plan's salary card
// ---------------------------------------------------------------------------

/**
 * What the period pays: the fixed part and what the KPI score earned of the KPI part, as one
 * stacked bar plus the figures. The bar shows proportions only; the money stays blurred
 * until revealed.
 */
export function KpiSalaryCard({
  salary,
  totalScore,
  periodOpen,
}: {
  salary: KpiPlanSalary;
  totalScore: number | null;
  periodOpen: boolean;
}) {
  const { t, locale } = useTranslation();
  const { currency } = salary;
  const earned = salary.kpiEarned ?? 0;
  const percentOf = (value: number) =>
    salary.amount > 0 ? Math.min(Math.max((value / salary.amount) * 100, 0), 100) : 0;
  const fixedWidth = percentOf(salary.fixedAmount);
  const earnedWidth = percentOf(earned);
  const restWidth = Math.max(100 - fixedWidth - earnedWidth, 0);

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t('kpiSalary.title')}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
            {t('kpiSalary.since', { month: formatMonth(salary.effectiveMonth, locale) })}
          </p>
        </div>
        <RevealToggle />
      </div>

      <p className="mt-3 text-xs font-medium text-slate-500 dark:text-slate-400">
        {salary.totalEarned === null ? t('kpiSalary.fixedOnly') : t('kpiSalary.payable')}
      </p>
      <div className="mt-0.5 min-h-[40px]">
        <SecretAmount
          value={salary.totalEarned ?? salary.fixedAmount}
          currency={currency}
          className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100"
        />
      </div>

      <div
        role="img"
        aria-label={t('kpiSalary.barLabel', {
          fixed: formatNumber(salary.fixedPercent, locale),
          kpi: formatNumber(salary.kpiPercent, locale),
          score: totalScore === null ? '—' : formatNumber(totalScore, locale),
        })}
        className="mt-3 flex h-3 w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-400/15"
      >
        <span
          className="bg-slate-400 dark:bg-slate-500"
          style={{ width: `${String(fixedWidth)}%` }}
        />
        <span
          className="animate-meter-fill bg-emerald-500 motion-reduce:animate-none dark:bg-emerald-400"
          style={{ width: `${String(earnedWidth)}%` }}
        />
        <span style={{ width: `${String(restWidth)}%` }} />
      </div>

      <dl className="mt-3 grid gap-2 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 rounded-full bg-slate-400 dark:bg-slate-500"
            />
            {t('kpiSalary.fixedPart', { percent: formatNumber(salary.fixedPercent, locale) })}
          </dt>
          <dd>
            <SecretAmount
              value={salary.fixedAmount}
              currency={currency}
              className="font-semibold text-slate-900 dark:text-slate-100"
            />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="flex min-w-0 items-center gap-2 text-slate-600 dark:text-slate-300">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full bg-emerald-500 dark:bg-emerald-400"
            />
            <span className="min-w-0">
              {t('kpiSalary.kpiPart', { percent: formatNumber(salary.kpiPercent, locale) })}
              {totalScore !== null ? (
                <span className="block text-xs text-slate-500 dark:text-slate-400">
                  {t('kpiSalary.byScore', { score: formatNumber(totalScore, locale) })}
                </span>
              ) : null}
            </span>
          </dt>
          <dd className="flex flex-shrink-0 items-baseline gap-1 text-right">
            {salary.kpiEarned === null ? (
              <span className="text-slate-400">—</span>
            ) : (
              <SecretAmount
                value={salary.kpiEarned}
                currency={currency}
                className="font-semibold text-emerald-700 dark:text-emerald-400"
              />
            )}
            <span className="text-xs text-slate-400">/</span>
            <SecretAmount
              value={salary.kpiAmount}
              currency={currency}
              className="text-xs text-slate-500 dark:text-slate-400"
            />
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-2 dark:border-slate-800">
          <dt className="text-slate-600 dark:text-slate-300">{t('kpiSalary.fullSalary')}</dt>
          <dd>
            <SecretAmount
              value={salary.amount}
              currency={currency}
              className="font-medium text-slate-700 dark:text-slate-200"
            />
          </dd>
        </div>
      </dl>

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {salary.kpiEarned === null
          ? t('kpiSalary.notCalculated')
          : periodOpen
            ? t('kpiSalary.interim')
            : t('kpiSalary.final')}
      </p>
    </section>
  );
}

/** One KPI row's share of the salary: what it is worth and what it earned so far. */
export function KpiItemSalary({
  result,
  currency,
}: {
  result: KpiResult;
  currency: SalaryCurrency;
}) {
  const { t } = useTranslation();

  if (result.salaryValue === null) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-lg bg-slate-50 px-3 py-2 text-xs dark:bg-slate-950/40">
      <span className="text-slate-500 dark:text-slate-400">
        {t('kpiSalary.itemValue')}{' '}
        <SecretAmount
          value={result.salaryValue}
          currency={currency}
          className="font-medium text-slate-700 dark:text-slate-200"
        />
      </span>
      <span className="text-slate-500 dark:text-slate-400">
        {t('kpiSalary.itemEarned')}{' '}
        {result.salaryEarned === null ? (
          <span className="text-slate-400">—</span>
        ) : (
          <SecretAmount
            value={result.salaryEarned}
            currency={currency}
            className="font-semibold text-emerald-700 dark:text-emerald-400"
          />
        )}
      </span>
    </div>
  );
}
