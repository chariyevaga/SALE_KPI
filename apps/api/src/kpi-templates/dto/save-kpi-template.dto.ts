import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

/** Largest value that fits kpi_template_items.target_value decimal(19,4). */
const MAX_TARGET_VALUE = 999_999_999_999_999;

export class KpiTemplateItemDto {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_definitions.id`' })
  @Matches(GUID_PATTERN, { message: 'kpiDefinitionId must be a GUID' })
  kpiDefinitionId: string;

  @ApiProperty({
    type: Number,
    minimum: 0.01,
    maximum: 100,
    example: 50,
    description:
      'En fazla 2 ondalık. Şablondaki bütün ağırlıkların toplamı tam 100 olmalıdır; aksi hâlde `KPI_TEMPLATE_WEIGHT_TOTAL`.',
  })
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100)
  weight: number;

  @ApiPropertyOptional({
    type: Number,
    nullable: true,
    minimum: 0,
    example: 500000,
    description:
      'İsteğe bağlı varsayılan hedef (en fazla 4 ondalık); döneme atanırken değiştirilebilir.',
  })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 4 })
  @Min(0)
  @Max(MAX_TARGET_VALUE)
  targetValue?: number | null;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    example: { storeIds: [2], currency: 'TMT' },
    description:
      'Tanımın `inputSchema` tarifine göre doldurulmuş girdiler; tarifi boş olan KPI için `{}`.',
  })
  @IsObject()
  inputValues: Record<string, unknown>;
}

export class SaveKpiTemplateDto {
  @ApiProperty({ type: String, maxLength: 200, example: 'MÜDÜR KPI 01' })
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    type: String,
    nullable: true,
    maxLength: 1000,
    example: 'Berkarar mağaza müdürü aylık karnesi',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(1000)
  description?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Verilmezse oluşturmada `true`, güncellemede değişmez. `true` pasif şablonu tekrar etkinleştirir.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ type: () => KpiTemplateItemDto, isArray: true, minItems: 1, maxItems: 50 })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => KpiTemplateItemDto)
  items: KpiTemplateItemDto[];
}
