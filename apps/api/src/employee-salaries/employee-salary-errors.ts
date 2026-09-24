import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BadRequestException, ConflictException } from '@nestjs/common';

/**
 * Machine-readable `code` values of salary errors. The web client translates them; the
 * English `message` is technical and never shown to users (kpi-template-errors.ts).
 */
export const EMPLOYEE_SALARY_ERROR_CODES = [
  'EMPLOYEE_SALARY_PERCENT_TOTAL',
  'EMPLOYEE_SALARY_MONTH_EXISTS',
  'EMPLOYEE_SALARY_PERIOD_CLOSED',
] as const;

export type EmployeeSalaryErrorCode = (typeof EMPLOYEE_SALARY_ERROR_CODES)[number];

export class EmployeeSalaryErrorResponse {
  @ApiProperty({ type: Number, example: 409 })
  statusCode: number;

  @ApiProperty({ type: String, example: 'Conflict' })
  error: string;

  @ApiProperty({ type: String })
  message: string;

  @ApiProperty({ type: String, enum: EMPLOYEE_SALARY_ERROR_CODES })
  code: EmployeeSalaryErrorCode;

  @ApiPropertyOptional({
    type: String,
    example: '2026-09',
    description: '`EMPLOYEE_SALARY_MONTH_EXISTS`: o ayın maaşı zaten var.',
  })
  effectiveMonth?: string;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    example: ['2026-08'],
    description:
      '`EMPLOYEE_SALARY_PERIOD_CLOSED`: değişikliğin geçerli maaşını değiştireceği kapanmış aylar.',
  })
  months?: string[];
}

export function salaryPercentTotal(): BadRequestException {
  return new BadRequestException({
    statusCode: 400,
    error: 'Bad Request',
    message: 'fixedPercent and kpiPercent must add up to 100.',
    code: 'EMPLOYEE_SALARY_PERCENT_TOTAL',
  });
}

export function salaryMonthExists(effectiveMonth: string): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: `The employee already has a salary from ${effectiveMonth}.`,
    code: 'EMPLOYEE_SALARY_MONTH_EXISTS',
    effectiveMonth,
  });
}

/** The change would alter the pay of closed months, which is final (ADR-049). */
export function salaryPeriodClosed(months: string[]): ConflictException {
  return new ConflictException({
    statusCode: 409,
    error: 'Conflict',
    message: `The change would alter the salary of closed KPI periods: ${months.join(', ')}.`,
    code: 'EMPLOYEE_SALARY_PERIOD_CLOSED',
    months,
  });
}
