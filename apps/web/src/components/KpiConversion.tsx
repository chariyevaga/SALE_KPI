import { formatDate, formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import type { KpiConversionDetail } from '../types/api';

function InfoIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="mt-0.5 h-4 w-4 flex-shrink-0"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

/**
 * The store conversion in words (ADR-052). Unlike sales or receipts it depends on which days
 * had a visitor count entered, so the number alone is not self-explanatory: this says which
 * days counted, what was divided by what, and why there is no value when there is none.
 */
export function KpiConversionExplanation({
  detail,
  value,
}: {
  detail: KpiConversionDetail;
  value: number | null;
}) {
  const { t, locale } = useTranslation();
  const count = (number: number) => formatNumber(number, locale);
  const coverage = count(detail.coverage);
  const last = detail.lastDay ? formatDate(detail.lastDay, locale) : '';
  const counted =
    detail.storeCount > 1
      ? t('kpiConversion.countedStores', {
          stores: count(detail.storeCount),
          last,
          possible: count(detail.possibleDays),
          counted: count(detail.countedDays),
          coverage,
        })
      : t('kpiConversion.counted', {
          last,
          possible: count(detail.possibleDays),
          counted: count(detail.countedDays),
          coverage,
        });

  let outcome: string;

  switch (detail.gap) {
    case 'no-days':
      outcome = t('kpiConversion.noDays');
      break;
    case 'low-coverage':
      outcome = t('kpiConversion.lowCoverage', { required: count(detail.requiredCoverage) });
      break;
    case 'no-visitors':
      outcome = t('kpiConversion.noVisitors');
      break;
    default:
      outcome = t('kpiConversion.result', {
        receipts: count(detail.receipts),
        visitors: count(detail.visitors),
        value: value === null ? '—' : count(value),
      });
  }

  return (
    <div
      className={`mt-3 flex gap-2 rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
        detail.gap
          ? 'bg-amber-500/10 text-amber-800 dark:text-amber-300'
          : 'bg-sky-500/10 text-slate-700 dark:text-slate-200'
      }`}
    >
      <InfoIcon />
      <div className="min-w-0 space-y-1">
        <p className="font-semibold">{t('kpiConversion.title')}</p>
        <p>{t('kpiConversion.formula')}</p>
        {detail.gap === 'no-days' ? null : <p>{counted}</p>}
        <p className="font-medium">{outcome}</p>
        <p className="opacity-80">{t('kpiConversion.rules')}</p>
      </div>
    </div>
  );
}
