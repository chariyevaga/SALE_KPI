import { useState, type FormEvent } from 'react';

import { useTranslation } from '../i18n/locale-store';
import { FormField } from './FormField';
import { Modal } from './Modal';
import { PasswordInput } from './PasswordInput';

interface PasswordConfirmModalProps {
  title: string;
  message: string;
  confirmLabel: string;
  /** Resolves once the action is done; rejects to keep the dialog open with `error`. */
  onConfirm: (password: string) => Promise<unknown>;
  onClose: () => void;
  pending: boolean;
  /** Shown under the field, e.g. "wrong password" or the lock time. */
  error: string | null;
}

/**
 * Asks the signed-in person for their own password before a sensitive action (ADR-053):
 * closing or reopening a KPI period. Full access alone is not enough; whoever sits at an
 * unlocked session still has to know the password.
 */
export function PasswordConfirmModal({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
  pending,
  error,
}: PasswordConfirmModalProps) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');

  function submit(event: FormEvent) {
    event.preventDefault();

    if (password !== '' && !pending) {
      // The caller shows the error; the field is cleared so a retry starts empty.
      void onConfirm(password).catch(() => setPassword(''));
    }
  }

  return (
    <Modal open stacked onClose={onClose} title={title}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <p className="whitespace-pre-line text-sm text-slate-700 dark:text-slate-200">{message}</p>
        <FormField label={t('passwordConfirm.label')} htmlFor="password-confirm" required>
          <PasswordInput
            id="password-confirm"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            required
          />
        </FormField>
        {error ? (
          <p role="alert" className="-mt-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-12 flex-1 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={password === '' || pending}
            className="h-12 flex-1 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-40 dark:bg-red-500 dark:hover:bg-red-400"
          >
            {pending ? t('passwordConfirm.checking') : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
