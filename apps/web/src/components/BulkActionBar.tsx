import { useEffect } from 'react';

import { formatNumber } from '../i18n/formatters';
import { useTranslation } from '../i18n/locale-store';
import { isBulkBarVisible, type BulkNotice } from '../lib/bulk';
import { Spinner } from './Spinner';

export interface BulkAction {
  key: string;
  label: string;
  onClick: () => void;
  tone?: 'primary' | 'neutral' | 'danger';
}

const TONE_CLASSES: Record<NonNullable<BulkAction['tone']>, string> = {
  primary: 'bg-emerald-400 text-slate-950 hover:bg-emerald-300',
  neutral:
    'border border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900',
  danger: 'border border-red-500/40 text-red-600 hover:bg-red-500/10 dark:text-red-400',
};

const NOTICE_CLASSES: Record<BulkNotice['tone'], string> = {
  success: 'bg-emerald-400/15 text-emerald-800 dark:text-emerald-200',
  error: 'bg-red-500/10 text-red-600 dark:text-red-400',
};

const SUCCESS_NOTICE_MS = 6_000;

/**
 * Bottom bar for list selections (ADR-035): selection count, actions and the result of the
 * last action. Fixed so the actions stay in thumb reach on phones; on desktop it starts
 * right of the 288px sidebar. Pages hide their FAB while `isBulkBarVisible` is true.
 */
export function BulkActionBar({
  count,
  actions,
  onClear,
  pendingKey,
  notice,
  onDismissNotice,
}: {
  count: number;
  actions: BulkAction[];
  onClear: () => void;
  /** Key of the action whose request is running; every action is disabled meanwhile. */
  pendingKey: string | null;
  notice: BulkNotice | null;
  /** Must be stable (useCallback): success notices call it after a few seconds. */
  onDismissNotice: () => void;
}) {
  const { t, locale } = useTranslation();

  // Success fades on its own; an error stays until dismissed or the next action.
  useEffect(() => {
    if (notice?.tone !== 'success') {
      return;
    }

    const timer = setTimeout(onDismissNotice, SUCCESS_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [notice, onDismissNotice]);

  return (
    <>
      {/* Mounted permanently so screen readers announce results reliably. */}
      <p aria-live="polite" className="sr-only">
        {notice?.tone === 'success' ? notice.text : ''}
      </p>

      {isBulkBarVisible(count, notice) ? (
        <div
          role="region"
          aria-label={t('common.bulkActions')}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-lg backdrop-blur lg:left-72 dark:border-slate-800 dark:bg-slate-950/95"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-2">
            {notice ? (
              <div
                role={notice.tone === 'error' ? 'alert' : undefined}
                className={`flex items-center gap-2 rounded-lg py-1 pl-3 pr-1 text-sm font-medium ${
                  NOTICE_CLASSES[notice.tone]
                }`}
              >
                <p className="flex-1">{notice.text}</p>
                <button
                  type="button"
                  onClick={onDismissNotice}
                  aria-label={t('common.close')}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full opacity-70 transition hover:opacity-100"
                >
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="h-4 w-4"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ) : null}

            {count > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {t('common.selectedCount', { count: formatNumber(count, locale) })}
                </p>
                <button
                  type="button"
                  onClick={onClear}
                  disabled={pendingKey !== null}
                  className="min-h-11 text-sm font-medium text-slate-500 underline-offset-4 hover:underline disabled:opacity-60 dark:text-slate-400"
                >
                  {t('common.clearSelection')}
                </button>
                <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
                  {actions.map((action) => (
                    <button
                      key={action.key}
                      type="button"
                      disabled={pendingKey !== null}
                      onClick={action.onClick}
                      className={`flex h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none ${
                        TONE_CLASSES[action.tone ?? 'neutral']
                      }`}
                    >
                      {pendingKey === action.key ? <Spinner /> : null}
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
