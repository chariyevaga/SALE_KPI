import { ApiProperty } from '@nestjs/swagger';

import type { EmployeeSalaryEntity } from './entities/employee-salary.entity.js';
import {
  SALARY_CURRENCIES,
  type SalaryCurrency,
  salaryMonthLabel,
  splitSalary,
} from './employee-salary-rules.js';

export class EmployeeSalaryResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  employeeId: string;

  @ApiProperty({ type: String, example: '2026-09', description: 'Geçerli olduğu ilk ay.' })
  effectiveMonth: string;

  @ApiProperty({ type: Number, example: 12000 })
  amount: number;

  @ApiProperty({ type: String, enum: SALARY_CURRENCIES })
  currency: SalaryCurrency;

  @ApiProperty({ type: Number, example: 30 })
  fixedPercent: number;

  @ApiProperty({ type: Number, example: 70 })
  kpiPercent: number;

  @ApiProperty({ type: Number, example: 3600, description: 'Sabit kısım: tutar × sabit yüzde.' })
  fixedAmount: number;

  @ApiProperty({
    type: Number,
    example: 8400,
    description: 'KPI’a bağlı kısım (tamamı). KPI puanıyla ödenecek tutar henüz hesaplanmaz.',
  })
  kpiAmount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class EmployeeSalaryListResponse {
  @ApiProperty({
    type: () => EmployeeSalaryResponse,
    nullable: true,
    description: 'Bu ay (UTC) geçerli olan maaş: ayı bu aydan sonra olmayan en yeni kayıt.',
  })
  current: EmployeeSalaryResponse | null;

  @ApiProperty({
    type: () => EmployeeSalaryResponse,
    isArray: true,
    description: 'Bütün maaşlar, en yeni ay önce.',
  })
  items: EmployeeSalaryResponse[];
}

export class EmployeeSalaryInForceResponse {
  @ApiProperty({ type: String, example: '2026-09', description: 'Sorulan ay.' })
  month: string;

  @ApiProperty({
    type: () => EmployeeSalaryResponse,
    nullable: true,
    description: 'O ay geçerli maaş: ayı o aydan sonra olmayan en yeni kayıt; yoksa `null`.',
  })
  salary: EmployeeSalaryResponse | null;
}

export function toEmployeeSalaryResponse(salary: EmployeeSalaryEntity): EmployeeSalaryResponse {
  return {
    id: salary.id,
    employeeId: salary.employeeId,
    effectiveMonth: salaryMonthLabel(salary.effectiveMonth),
    amount: salary.amount,
    currency: salary.currency,
    fixedPercent: salary.fixedPercent,
    kpiPercent: salary.kpiPercent,
    ...splitSalary(salary.amount, salary.fixedPercent),
    createdAt: salary.createdAt,
    updatedAt: salary.updatedAt,
  };
}
