import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';
import { MAX_TARGET_DECIMALS, MAX_TARGET_VALUE } from '../../kpi-assignments/kpi-assignment-rules.js';

export class KpiActualDto {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_assignment_items.id`' })
  @Matches(GUID_PATTERN, { message: 'id must be a GUID' })
  id: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    minimum: 0,
    example: 85,
    description: `Gerçekleşen değer; en fazla ${MAX_TARGET_DECIMALS} ondalık. \`null\` değeri boşaltır.`,
  })
  // JSON already carries a number; @Type(() => Number) would turn `null` into 0.
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: MAX_TARGET_DECIMALS })
  @Min(0)
  @Max(MAX_TARGET_VALUE)
  actualValue: number | null;
}

export class SaveKpiActualsDto {
  @ApiProperty({
    type: () => KpiActualDto,
    isArray: true,
    minItems: 1,
    maxItems: 50,
    description: 'Yalnız elle girilen KPI satırları gönderilebilir.',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => KpiActualDto)
  items: KpiActualDto[];
}
