import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';
import { MAX_PERIOD_YEAR, MIN_PERIOD_YEAR } from '../../kpi-periods/kpi-period-rules.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class ListKpiAssignmentsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({
    type: String,
    maxLength: 100,
    description:
      'Çalışanın adında, soyadında ve kullanıcı adında arar; büyük/küçük harf ve aksan duyarsızdır.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Şablona göre filtreler.' })
  @IsOptional()
  @Matches(GUID_PATTERN, { message: 'templateId must be a GUID' })
  templateId?: string;
}

export class MyKpiPlanQueryDto {
  @ApiPropertyOptional({
    type: Number,
    minimum: MIN_PERIOD_YEAR,
    maximum: MAX_PERIOD_YEAR,
    description: 'Ay ile birlikte verilir; verilmezse en yeni plan döner.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(MIN_PERIOD_YEAR)
  @Max(MAX_PERIOD_YEAR)
  year?: number;

  @ApiPropertyOptional({ type: Number, minimum: 1, maximum: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;
}
