import { useState } from 'react';

import { useTranslation } from '../i18n/locale-store';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '../i18n/translations';
import { Modal } from './Modal';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('appShell.language')}
        className="flex h-9 min-w-[2.5rem] items-center justify-center rounded-full border border-slate-200 bg-slate-100 px-2.5 text-xs font-semibold uppercase text-slate-600 transition hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-700"
      >
        {locale}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t('appShell.language')}>
        <div className="flex flex-col gap-1.5">
          {SUPPORTED_LOCALES.map((code) => {
            const isActive = code === locale;

            return (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLocale(code);
                  setOpen(false);
                }}
                aria-pressed={isActive}
                className={`flex min-h-[48px] items-center justify-between rounded-xl px-4 text-left text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-400/15 text-emerald-600 dark:text-emerald-400'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <span>{LOCALE_LABELS[code]}</span>
                <span className="text-xs uppercase text-slate-500">{code}</span>
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
