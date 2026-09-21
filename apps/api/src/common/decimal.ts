/** Converts SQL Server decimal columns, which the driver may hand back as strings. */
export const decimalTransformer = {
  to: (value: number | null | undefined) => value,
  from: (value: number | string | null) => (value === null ? null : Number(value)),
};
