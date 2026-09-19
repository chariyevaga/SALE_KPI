export const KPI_SCOPES = ['store', 'employee'] as const;
export const KPI_UNITS = ['money', 'count', 'percent', 'score'] as const;
export const KPI_INPUT_MODES = ['calculated', 'manual'] as const;

export type KpiScope = (typeof KPI_SCOPES)[number];
export type KpiUnit = (typeof KPI_UNITS)[number];
export type KpiInputMode = (typeof KPI_INPUT_MODES)[number];
