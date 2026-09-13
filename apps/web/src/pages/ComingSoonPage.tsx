import { AppShell } from '../components/AppShell';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';

export function ComingSoonPage({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useTranslation();
  const title = t(titleKey);

  return (
    <AppShell title={title} breadcrumbs={[{ label: t('common.home'), to: '/leaderboard' }, { label: title }]}>
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-600 dark:text-emerald-400">
          <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{t('common.comingSoon')}</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500 dark:text-slate-400">{t('common.comingSoonHint')}</p>
      </div>
    </AppShell>
  );
}
