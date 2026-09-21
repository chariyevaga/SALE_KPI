import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * Machine-readable `code` values of KPI template errors. The web client translates
 * these (the English `message` is technical and never shown to users).
 */
export const KPI_TEMPLATE_ERROR_CODES = [
  'KPI_TEMPLATE_WEIGHT_TOTAL',
  'KPI_TEMPLATE_UNKNOWN_DEFINITION',
  'KPI_TEMPLATE_INVALID_INPUT',
  'KPI_TEMPLATE_UNKNOWN_STORE',
  'KPI_TEMPLATE_DUPLICATE_ITEM',
  'KPI_TEMPLATE_NAME_TAKEN',
  'KPI_TEMPLATE_IN_USE',
] as const;

export type KpiTemplateErrorCode = (typeof KPI_TEMPLATE_ERROR_CODES)[number];

export function kpiTemplateBadRequest(
  code: Exclude<KpiTemplateErrorCode, 'KPI_TEMPLATE_NAME_TAKEN'>,
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

export function kpiTemplateNameTaken(): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: 'A KPI template with this name already exists.',
    code: 'KPI_TEMPLATE_NAME_TAKEN',
  });
}

/**
 * A template a KPI plan was built from keeps that plan's history readable, so it can only
 * be deactivated, never deleted (ADR-040).
 */
export function kpiTemplateInUse(
  templates: ReadonlyArray<{ id: string; name: string; planCount: number }>,
): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: 'These KPI templates are used by KPI plans and cannot be deleted.',
    code: 'KPI_TEMPLATE_IN_USE',
    templates: [...templates],
  });
}
