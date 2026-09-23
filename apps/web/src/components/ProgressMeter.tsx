const HEIGHTS = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
} as const;

interface ProgressMeterProps {
  value: number;
  max?: number;
  /** Accessible name, e.g. the KPI whose achievement this is. */
  label: string;
  /** What a screen reader announces, formatted for the chosen language ("%75"). */
  valueText: string;
  size?: keyof typeof HEIGHTS;
  className?: string;
}

/**
 * Horizontal progress bar for target achievement and scores (docs/UI_GUIDELINES.md
 * "İlerleme çubukları"). The fill and its track are one hue, so the bar reads as a single
 * scale; a value past `max` fills it and a negative one leaves it empty. The number is always
 * printed next to the bar as well, so the bar never carries the value alone.
 */
export function ProgressMeter({
  value,
  max = 100,
  label,
  valueText,
  size = 'md',
  className = '',
}: ProgressMeterProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = max > 0 ? (clamped / max) * 100 : 0;

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={clamped}
      aria-valuetext={valueText}
      className={`w-full overflow-hidden rounded-full bg-emerald-100 dark:bg-emerald-400/15 ${HEIGHTS[size]} ${className}`}
    >
      <div
        className="h-full animate-meter-fill rounded-full bg-emerald-600 transition-[width] duration-700 ease-out motion-reduce:animate-none motion-reduce:transition-none dark:bg-emerald-400"
        style={{ width: `${String(percent)}%` }}
      />
    </div>
  );
}
