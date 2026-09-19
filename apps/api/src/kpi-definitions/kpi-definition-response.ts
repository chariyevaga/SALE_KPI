import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { KpiDefinitionEntity } from './entities/kpi-definition.entity.js';
import {
  KPI_INPUT_MODES,
  KPI_SCOPES,
  KPI_UNITS,
  type KpiInputMode,
  type KpiScope,
  type KpiUnit,
} from './kpi-definition.types.js';
import {
  KPI_INPUT_TYPES,
  KPI_LOOKUP_SOURCES,
  KpiInputSchemaError,
  parseKpiInputSchema,
  parseLocalizedText,
  type KpiInputField,
  type KpiInputType,
  type KpiLookupSource,
  type LocalizedText,
} from './kpi-input-schema.js';

export class LocalizedTextResponse {
  @ApiProperty({ type: String, description: 'Türkçe metin; her zaman doludur ve yedek dildir.' })
  tr: string;

  @ApiPropertyOptional({ type: String })
  en?: string;

  @ApiPropertyOptional({ type: String })
  ru?: string;

  @ApiPropertyOptional({ type: String })
  tk?: string;
}

export class KpiSelectOptionResponse {
  @ApiProperty({ type: String, example: 'TMT' })
  value: string;

  @ApiProperty({ type: () => LocalizedTextResponse })
  label: LocalizedTextResponse;
}

export class KpiInputFieldResponse {
  @ApiProperty({
    type: String,
    example: 'storeIds',
    description: 'Hedef girdisinde bu alanın değerinin tutulacağı anahtar.',
  })
  key: string;

  @ApiProperty({ type: String, enum: KPI_INPUT_TYPES })
  type: KpiInputType;

  @ApiProperty({ type: () => LocalizedTextResponse })
  label: LocalizedTextResponse;

  @ApiProperty({ type: Boolean })
  required: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Yalnız `select` ve `lookup`: birden fazla değer seçilebilir.',
  })
  multiple?: boolean;

  @ApiPropertyOptional({
    type: String,
    enum: KPI_LOOKUP_SOURCES,
    description: 'Yalnız `lookup`: seçeneklerin okunacağı kaynak (`stores` → `GET /stores`).',
  })
  source?: KpiLookupSource;

  @ApiPropertyOptional({
    type: () => KpiSelectOptionResponse,
    isArray: true,
    description: 'Yalnız `select`: sabit seçenekler.',
  })
  options?: KpiSelectOptionResponse[];

  @ApiPropertyOptional({ type: Number, description: 'Yalnız `number`: en küçük değer.' })
  min?: number;

  @ApiPropertyOptional({ type: Number, description: 'Yalnız `number`: en büyük değer.' })
  max?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Yalnız `number`: izin verilen ondalık basamak sayısı (0–4).',
  })
  decimals?: number;
}

export class KpiDefinitionResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'STORE_SALES' })
  code: string;

  @ApiProperty({ type: () => LocalizedTextResponse })
  name: LocalizedTextResponse;

  @ApiProperty({ type: String, enum: KPI_SCOPES })
  scope: KpiScope;

  @ApiProperty({ type: String, enum: KPI_UNITS })
  unit: KpiUnit;

  @ApiProperty({ type: String, enum: KPI_INPUT_MODES })
  inputMode: KpiInputMode;

  @ApiProperty({ type: Number, example: 10 })
  sortOrder: number;

  @ApiProperty({
    type: () => KpiInputFieldResponse,
    isArray: true,
    description: 'Hedef girilirken istenecek alanlar. Hedef sayısı bu listede yer almaz.',
  })
  inputSchema: KpiInputFieldResponse[];
}

function parseJsonColumn(raw: string, path: string): unknown {
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new KpiInputSchemaError(path, 'is not valid JSON.');
  }
}

export function readKpiDefinitionName(definition: KpiDefinitionEntity): LocalizedText {
  const path = `kpi_definitions[${definition.code}].name`;

  return parseLocalizedText(parseJsonColumn(definition.name, path), path);
}

export function readKpiDefinitionInputSchema(definition: KpiDefinitionEntity): KpiInputField[] {
  const path = `kpi_definitions[${definition.code}].input_schema`;

  return parseKpiInputSchema(parseJsonColumn(definition.inputSchema, path), path);
}

export function toKpiDefinitionResponse(definition: KpiDefinitionEntity): KpiDefinitionResponse {
  return {
    id: definition.id,
    code: definition.code,
    name: readKpiDefinitionName(definition),
    scope: definition.scope,
    unit: definition.unit,
    inputMode: definition.inputMode,
    sortOrder: definition.sortOrder,
    inputSchema: readKpiDefinitionInputSchema(definition),
  };
}
