/**
 * Row selection checkbox with a 44px touch target (ADR-035). `label` names the row for
 * screen readers; with `showLabel` it is printed next to the box and is tappable too.
 */
export function SelectCheckbox({
  checked,
  label,
  onChange,
  disabledReason,
  indeterminate = false,
  showLabel = false,
}: {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  /** When set the box is disabled and this explains why (tooltip + screen reader). */
  disabledReason?: string | undefined;
  indeterminate?: boolean;
  showLabel?: boolean;
}) {
  const disabled = disabledReason !== undefined;

  return (
    <label
      title={disabledReason}
      className={`flex min-h-11 flex-shrink-0 items-center ${showLabel ? 'pr-3' : ''} ${
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
      }`}
    >
      <span className="flex h-11 w-11 items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          aria-label={showLabel ? undefined : label}
          aria-description={disabledReason}
          ref={(element) => {
            if (element) {
              element.indeterminate = indeterminate;
            }
          }}
          onChange={(event) => onChange(event.target.checked)}
          className="h-5 w-5 cursor-[inherit] accent-emerald-500"
        />
      </span>
      {showLabel ? (
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{label}</span>
      ) : null}
    </label>
  );
}
