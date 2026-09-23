import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * Machine-readable `code` values of KPI plan errors. The web client translates them; the
 * English `message` is technical and never shown to users (kpi-template-errors.ts).
 */
export const KPI_ASSIGNMENT_ERROR_CODES = [
  'KPI_ASSIGNMENT_EXISTS',
  'KPI_ASSIGNMENT_INELIGIBLE',
  'KPI_ASSIGNMENT_UNKNOWN_TEMPLATE',
  'KPI_ASSIGNMENT_EMPTY_TEMPLATE',
  'KPI_ASSIGNMENT_UNKNOWN_ITEM',
  'KPI_ASSIGNMENT_INVALID_TARGET',
  'KPI_ASSIGNMENT_CALCULATED_ITEM',
] as const;

export type KpiAssignmentErrorCode = (typeof KPI_ASSIGNMENT_ERROR_CODES)[number];

export function kpiAssignmentBadRequest(
  code: Exclude<KpiAssignmentErrorCode, 'KPI_ASSIGNMENT_EXISTS'>,
  message: string,
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

/** One plan per employee and period (docs/BUSINESS_RULES.md "Organizasyon"). */
export function kpiAssignmentExists(employeeIds: string[]): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: 'These employees already have a plan in this period.',
    code: 'KPI_ASSIGNMENT_EXISTS',
    employeeIds,
  });
}
