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
