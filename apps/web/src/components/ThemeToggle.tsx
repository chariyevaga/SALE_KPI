import { useThemeStore, type ThemePreference } from '../theme/theme-store';
import { useTranslation, type TranslationKey } from '../i18n/locale-store';

const OPTIONS: { value: ThemePreference; icon: string; labelKey: TranslationKey }[] = [
  { value: 'light', icon: '☀', labelKey: 'settings.themeLight' },
  { value: 'dark', icon: '☾', labelKey: 'settings.themeDark' },
  { value: 'system', icon: '⚙', labelKey: 'settings.themeSystem' },
];

export function ThemeToggle() {
  const { t } = useTranslation();
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  return (
    <div className="inline-flex items-center gap-0.5 rounded-full border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-900">
      {OPTIONS.map((option) => {
        const isActive = option.value === preference;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            aria-pressed={isActive}
            aria-label={t(option.labelKey)}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm transition ${
              isActive
                ? 'bg-emerald-400 text-slate-950'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {option.icon}
          </button>
        );
      })}
    </div>
  );
}
