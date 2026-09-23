import { BadRequestException } from '@nestjs/common';

/**
 * Machine-readable `code` values of visitor count errors. The web client translates them;
 * the English `message` is technical and never shown to users (kpi-template-errors.ts).
 * A closed month answers with the period error `KPI_PERIOD_CLOSED` (kpi-period-errors.ts).
 */
export const STORE_VISITOR_COUNT_ERROR_CODES = [
  'STORE_VISITOR_COUNT_UNKNOWN_STORE',
  'STORE_VISITOR_COUNT_FUTURE_DATE',
] as const;

export type StoreVisitorCountErrorCode = (typeof STORE_VISITOR_COUNT_ERROR_CODES)[number];

export function storeVisitorCountBadRequest(
  code: StoreVisitorCountErrorCode,
  message: string,
): BadRequestException {
  return new BadRequestException({ statusCode: 400, error: 'Bad Request', message, code });
}
