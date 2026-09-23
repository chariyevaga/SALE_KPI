import type { ReactNode } from 'react';

import { useTranslation } from '../i18n/locale-store';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons shown before the close button, e.g. the record info button. */
  headerActions?: ReactNode;
  /**
   * `sm` (default) fits a short form. `lg` is for reading long content: wider, and its body
   * scrolls under a fixed header. `sm` does not scroll, so dropdowns inside it are not cut off.
   */
  size?: 'sm' | 'lg';
  /** Above every other modal: the app-wide confirmation dialog. */
  stacked?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  headerActions,
  size = 'sm',
  stacked = false,
}: ModalProps) {
  const isLarge = size === 'lg';
  const { t } = useTranslation();

  if (!open) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 flex items-end justify-center sm:items-center ${
        stacked ? 'z-50' : 'z-30'
      }`}
    >
      <button
        type="button"
        aria-label={t('common.closeDialog', { title })}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative z-10 w-full rounded-t-3xl border border-slate-200 bg-white p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl dark:border-slate-800 dark:bg-slate-900 ${
          isLarge ? 'flex max-h-[90dvh] max-w-2xl flex-col' : 'max-w-sm'
        }`}
      >
        <div className="mb-4 flex flex-shrink-0 items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <div className="flex items-center gap-1">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label={t('common.close')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-5 w-5"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
        {isLarge ? (
          <div className="-mx-5 min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
