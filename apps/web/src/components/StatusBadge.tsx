/** Explicit active/inactive status (dot + text), so a status cell is never left blank. */
export function StatusBadge({ isActive, label }: { isActive: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium ${
        isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 flex-shrink-0 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'
        }`}
      />
      {label}
    </span>
  );
}
