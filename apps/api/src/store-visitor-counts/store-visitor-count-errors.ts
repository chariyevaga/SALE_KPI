import { BadRequestException } from '@nestjs/common';

/**
 * Machine-readable `code` values of visitor count errors. The web client translates them;
 * the English `message` is technical and never shown to users (kpi-template-errors.ts).
 * A closed month answers with the period error `KPI_PERIOD_CLOSED` (kpi-period-errors.ts).
 */
export const STORE_VISITOR_COUNT_ERROR_CODES = [
  'STORE_VISITOR_COUNT_UNKNOWN_STORE',
  'STORE_VISITOR_COUNT_FUTURE_DATE',
  // Excel template and import (ADR-055).
  'STORE_VISITOR_COUNT_TEMPLATE_RANGE',
  // Report (ADR-056).
  'STORE_VISITOR_COUNT_REPORT_RANGE',
  'STORE_VISITOR_COUNT_IMPORT_FILE',
  'STORE_VISITOR_COUNT_IMPORT_TOO_LARGE',
  'STORE_VISITOR_COUNT_IMPORT_EMPTY',
  'STORE_VISITOR_COUNT_IMPORT_INVALID',
] as const;

export type StoreVisitorCountErrorCode = (typeof STORE_VISITOR_COUNT_ERROR_CODES)[number];

export function storeVisitorCountBadRequest(
  code: StoreVisitorCountErrorCode,
  message: string,
  /** Extra fields of the answer, e.g. the import's wrong rows. */
  details: Record<string, unknown> = {},
): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message,
    code,
    ...details,
  });
}
