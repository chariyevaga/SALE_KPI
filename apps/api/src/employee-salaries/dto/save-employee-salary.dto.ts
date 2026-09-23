import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, Matches, Max, Min } from 'class-validator';

import {
  MAX_SALARY_AMOUNT,
  SALARY_CURRENCIES,
  SALARY_MONTH_PATTERN,
  type SalaryCurrency,
} from '../employee-salary-rules.js';

/** Body of both creating and correcting a salary (ADR-048). */
export class SaveEmployeeSalaryDto {
  @ApiProperty({
    type: String,
    example: '2026-09',
    description:
      'Maaşın geçerli olduğu ilk ay (`YYYY-MM`). Sonraki aylarda yeni maaş girilene kadar geçerlidir.',
  })
  @Matches(SALARY_MONTH_PATTERN, { message: 'effectiveMonth must be a month in YYYY-MM format' })
  effectiveMonth: string;

  @ApiProperty({ type: Number, example: 12000, minimum: 0.01, maximum: MAX_SALARY_AMOUNT })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0.01)
  @Max(MAX_SALARY_AMOUNT)
  amount: number;

  @ApiProperty({ type: String, enum: SALARY_CURRENCIES, example: 'TMT' })
  @IsIn(SALARY_CURRENCIES)
  currency: SalaryCurrency;

  @ApiProperty({
    type: Number,
    example: 30,
    minimum: 0,
    maximum: 100,
    description: 'Maaşın sabit ödenen yüzdesi.',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  fixedPercent: number;

  @ApiProperty({
    type: Number,
    example: 70,
    minimum: 0,
    maximum: 100,
    description:
      'Maaşın KPI’a bağlı yüzdesi. `fixedPercent + kpiPercent` tam 100 olmalıdır (`EMPLOYEE_SALARY_PERCENT_TOTAL`).',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2, allowNaN: false, allowInfinity: false })
  @Min(0)
  @Max(100)
  kpiPercent: number;
}
