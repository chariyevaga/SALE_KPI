import { formatDateTime, formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import type { KpiResult } from '../types/api';
import { ProgressMeter } from './ProgressMeter';

function CheckCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4 flex-shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Icon and text together, so reaching a target never rests on colour alone. */
function TargetReachedBadge() {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-medium text-emerald-700 dark:text-emerald-400">
      <CheckCircleIcon />
      {t('kpiProgress.reached')}
    </span>
  );
}

interface KpiScoreSummaryProps {
  totalScore: number | null;
  scoredItemCount: number;
  itemCount: number;
  calculatedAt: string | null;
}

/** A plan's total score as the screen's headline number, with its 0–100 bar (ADR-041). */
export function KpiScoreSummary({
  totalScore,
  scoredItemCount,
  itemCount,
  calculatedAt,
}: KpiScoreSummaryProps) {
  const { t, locale } = useTranslation();

  if (totalScore === null) {
    return (
      <p className="text-sm text-slate-500 dark:text-slate-400">{t('kpiProgress.notCalculated')}</p>
    );
  }

  const score = formatNumber(totalScore, locale);
  const outOf = t('kpiProgress.outOf', { max: formatNumber(100, locale) });

  return (
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
        {t('kpiProgress.totalScore')}
      </p>
      <p className="mt-1 flex items-baseline gap-1.5">
        <span className="text-5xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {score}
        </span>
        <span className="text-lg font-medium text-slate-400 dark:text-slate-500">{outOf}</span>
      </p>
      <ProgressMeter
        className="mt-3"
        size="lg"
        value={totalScore}
        label={t('kpiProgress.totalScore')}
        valueText={`${score} ${outOf}`}
      />
      {calculatedAt ? (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          {t('kpiProgress.calculatedAt', { at: formatDateTime(calculatedAt, locale) })}
        </p>
      ) : null}
      {scoredItemCount < itemCount ? (
        <p className="mt-2 inline-block rounded-lg bg-amber-500/10 px-2 py-1 text-xs text-amber-700 dark:text-amber-400">
          {t('kpiProgress.incomplete', {
            done: formatNumber(scoredItemCount, locale),
            total: formatNumber(itemCount, locale),
          })}
        </p>
      ) : null}
    </div>
  );
}

interface KpiAchievementProps {
  result: KpiResult;
  /** The KPI's name, for the bar's accessible label. */
  name: string;
  currency?: string | undefined;
}

/**
 * One plan row's result: achievement against the target as a bar, the actual and target
 * values, and what the row added to the score. Achievement past 100% fills the bar and says
 * "target reached"; the percentage itself stays uncapped, as the API stores it.
 */
export function KpiAchievement({ result, name, currency }: KpiAchievementProps) {
  const { t, locale } = useTranslation();
  const { actualValue, targetValue, rawAchievement, weightedScore } = result;
  const withUnit = (value: number) =>
    currency ? `${formatNumber(value, locale)} ${currency}` : formatNumber(value, locale);
  const scored =
    rawAchievement !== null &&
    actualValue !== null &&
    targetValue !== null &&
    weightedScore !== null;
  const percent =
    rawAchievement === null
      ? '—'
      : t('kpiProgress.percent', { value: formatNumber(rawAchievement, locale) });

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
          {t('kpiProgress.achievement')}
        </span>
        <span className="flex items-center gap-2">
          {scored && rawAchievement >= 100 ? <TargetReachedBadge /> : null}
          <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100">
            {percent}
          </span>
        </span>
      </div>

      {scored ? (
        <>
          <ProgressMeter
            className="mt-2"
            value={rawAchievement}
            label={t('kpiProgress.meterLabel', { name })}
            valueText={percent}
          />
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs tabular-nums text-slate-500 dark:text-slate-400">
            <span>
              {t('kpiProgress.actualOfTarget', {
                actual: withUnit(actualValue),
                target: withUnit(targetValue),
              })}
            </span>
            <span>
              {t('kpiProgress.contribution', {
                score: formatNumber(weightedScore, locale),
                weight: formatNumber(result.weight, locale),
              })}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {actualValue !== null
            ? `${t('kpiProgress.actualOnly', { actual: withUnit(actualValue) })} · `
            : ''}
          {targetValue === null || targetValue === 0
            ? t('kpiProgress.noTarget')
            : result.conversion
              ? t('kpiConversion.notScored')
              : t('kpiProgress.noActual')}
        </p>
      )}
    </div>
  );
}
