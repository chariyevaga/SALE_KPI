import { useTranslation } from '../i18n/locale-store';
import { StoreIcon } from './FilterSelect';

export function BriefcaseIcon({ className = '' }: { className?: string }) {
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
      <rect x="3" y="7" width="18" height="13" rx="2.5" />
      <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 12.5h18" />
    </svg>
  );
}

/**
 * An employee's job title and default store (ADR-058), each with its icon; nothing when
 * neither is set. `stacked` puts them on two centred lines for narrow places; otherwise
 * they share one line.
 */
export function JobStoreMeta({
  jobTitle,
  storeName,
  stacked = false,
}: {
  jobTitle: string | null;
  storeName: string | null;
  stacked?: boolean;
}) {
  const { t } = useTranslation();

  if (!jobTitle && !storeName) {
    return null;
  }

  return (
    <span
      className={`flex min-w-0 text-xs text-slate-500 dark:text-slate-400 ${
        stacked ? 'w-full flex-col items-center gap-0.5' : 'items-center gap-x-3'
      }`}
    >
      {jobTitle ? (
        <span className={`flex items-center gap-1 ${stacked ? 'max-w-full' : 'min-w-0'}`}>
          <BriefcaseIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="sr-only">{t('employeeCard.jobTitle')}:</span>
          <span className="truncate">{jobTitle}</span>
        </span>
      ) : null}
      {storeName ? (
        <span
          className={`flex items-center gap-1 ${stacked ? 'max-w-full' : 'min-w-0 flex-shrink-0'}`}
        >
          <StoreIcon className="h-3.5 w-3.5 flex-shrink-0" />
          <span className="sr-only">{t('employeeCard.defaultStore')}:</span>
          <span className="truncate">{storeName}</span>
        </span>
      ) : null}
    </span>
  );
}
