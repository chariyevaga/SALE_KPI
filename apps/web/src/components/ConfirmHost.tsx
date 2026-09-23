import { useTranslation } from '../i18n/locale-store';
import { useConfirmStore } from '../store/confirm-store';
import { Modal } from './Modal';

/**
 * Renders the app-wide confirmation dialog (`confirmAction`). Mounted once in App, above
 * every other modal. Cancel has the focus, so a stray Enter never confirms a deletion.
 */
export function ConfirmHost() {
  const { t } = useTranslation();
  const pending = useConfirmStore((state) => state.pending);
  const settle = useConfirmStore((state) => state.settle);

  if (!pending) {
    return null;
  }

  const danger = pending.tone !== 'default';

  return (
    <Modal open stacked onClose={() => settle(false)} title={t('common.confirmTitle')}>
      <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">
        {pending.message}
      </p>
      <div className="mt-5 flex gap-2">
        <button
          type="button"
          autoFocus
          onClick={() => settle(false)}
          className="h-12 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={() => settle(true)}
          className={`h-12 flex-1 rounded-xl text-sm font-semibold transition ${
            danger
              ? 'bg-red-600 text-white hover:bg-red-500 dark:bg-red-500 dark:hover:bg-red-400'
              : 'bg-emerald-400 text-slate-950 hover:bg-emerald-300'
          }`}
        >
          {pending.confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  );
}
