import type { ReactNode } from 'react';

export const formInputClassName =
  'h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

/**
 * Denser variant for repeated rows (KPI template items). Stays at the 44px touch
 * minimum, and at 16px text so iOS Safari does not zoom in on focus.
 */
export const formInputDenseClassName =
  'h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100';

/** Red asterisk for required fields; hidden from screen readers, which get `required`. */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-red-500 dark:text-red-400">
      *
    </span>
  );
}

export function FormField({
  label,
  htmlFor,
  hint,
  required = false,
  dense = false,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string | undefined;
  required?: boolean;
  dense?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label
        htmlFor={htmlFor}
        className={`block font-medium text-slate-700 dark:text-slate-300 ${
          dense ? 'mb-1 truncate text-xs' : 'mb-1.5 text-sm'
        }`}
      >
        {label}
        {required ? <RequiredMark /> : null}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">{hint}</p> : null}
    </div>
  );
}
