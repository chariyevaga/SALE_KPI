import { create } from 'zustand';

/** What the confirmation asks. */
export interface ConfirmRequest {
  message: string;
  /** Label of the confirming button; defaults to "Confirm". */
  confirmLabel?: string;
  /** `danger` paints the confirming button red: deleting, revoking, deactivating. */
  tone?: 'danger' | 'default';
}

interface PendingConfirm extends ConfirmRequest {
  resolve: (confirmed: boolean) => void;
}

interface ConfirmState {
  pending: PendingConfirm | null;
  open: (request: ConfirmRequest) => Promise<boolean>;
  settle: (confirmed: boolean) => void;
}

/**
 * One confirmation dialog for the whole app, rendered by ConfirmHost. It replaces the
 * browser's `window.confirm`, which some browsers and in-app web views answer "no" to
 * without showing anything, so the guarded action silently never ran.
 */
export const useConfirmStore = create<ConfirmState>((set, get) => ({
  pending: null,
  open: (request) =>
    new Promise<boolean>((resolve) => {
      // A newer question replaces an unanswered one, which counts as "no".
      get().pending?.resolve(false);
      set({ pending: { ...request, resolve } });
    }),
  settle: (confirmed) => {
    const pending = get().pending;

    set({ pending: null });
    pending?.resolve(confirmed);
  },
}));

/** Asks in the app's own dialog; resolves true only when the person confirms. */
export function confirmAction(request: ConfirmRequest): Promise<boolean> {
  return useConfirmStore.getState().open(request);
}
