import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  LocalizedTextResponse,
  readKpiDefinitionName,
} from '../kpi-definitions/kpi-definition-response.js';
import {
  KPI_INPUT_MODES,
  KPI_SCOPES,
  KPI_UNITS,
  type KpiInputMode,
  type KpiScope,
  type KpiUnit,
} from '../kpi-definitions/kpi-definition.types.js';
import type { KpiTemplateItemEntity } from './entities/kpi-template-item.entity.js';
import type { KpiTemplateEntity } from './entities/kpi-template.entity.js';
import { KPI_TEMPLATE_ERROR_CODES, type KpiTemplateErrorCode } from './kpi-template-errors.js';
import { sumWeights } from './kpi-template-rules.js';

export class KpiTemplateDefinitionResponse {
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
}

export class KpiTemplateItemResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  kpiDefinitionId: string;

  @ApiProperty({ type: () => KpiTemplateDefinitionResponse })
  definition: KpiTemplateDefinitionResponse;

  @ApiProperty({ type: Number, example: 50 })
  weight: number;

  @ApiProperty({ type: Number, nullable: true, example: 500000 })
  targetValue: number | null;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    example: { storeIds: [2], currency: 'TMT' },
    description:
      'Kanonik biçim: tarif sırası, boş isteğe bağlı alanlar yok, çoklu değerler sıralı.',
  })
  inputValues: Record<string, unknown>;

  @ApiProperty({ type: Number, example: 1 })
  sortOrder: number;
}

export class KpiTemplateResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'MÜDÜR KPI 01' })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({
    type: Number,
    example: 100,
    description: 'Kaydedilmiş şablonlarda her zaman 100.',
  })
  totalWeight: number;

  @ApiProperty({ type: () => KpiTemplateItemResponse, isArray: true })
  items: KpiTemplateItemResponse[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class KpiTemplateSummaryResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String, nullable: true })
  description: string | null;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: Number, example: 4 })
  itemCount: number;

  @ApiProperty({ type: Number, example: 100 })
  totalWeight: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class KpiTemplateListResponse {
  @ApiProperty({ type: () => KpiTemplateSummaryResponse, isArray: true })
  items: KpiTemplateSummaryResponse[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;
}

export class KpiTemplateCopyResultResponse {
  @ApiProperty({ type: String, format: 'uuid', description: 'Kopyalanan şablon' })
  sourceId: string;

  @ApiProperty({ type: String, format: 'uuid', description: 'Oluşan kopya' })
  id: string;

  @ApiProperty({ type: String, example: 'MÜDÜR KPI 01 (2)' })
  name: string;
}

export class KpiTemplateBulkCopyResponse {
  @ApiProperty({
    type: () => KpiTemplateCopyResultResponse,
    isArray: true,
    description: 'İstekteki sırayla oluşan kopyalar.',
  })
  copies: KpiTemplateCopyResultResponse[];
}

export class KpiTemplateErrorResponse {
  @ApiProperty({ type: Number, example: 400 })
  statusCode: number;

  @ApiProperty({ type: String, example: 'Bad Request' })
  error: string;

  @ApiProperty({ type: String, example: 'Item weights must add up to 100 (got 110).' })
  message: string;

  @ApiProperty({ type: String, enum: KPI_TEMPLATE_ERROR_CODES })
  code: KpiTemplateErrorCode;

  @ApiPropertyOptional({
    type: Number,
    description: '`KPI_TEMPLATE_WEIGHT_TOTAL`: gönderilen ağırlıkların toplamı.',
  })
  totalWeight?: number;

  @ApiPropertyOptional({
    type: Number,
    description: 'Hatalı `items[]` elemanının sırası (0 tabanlı).',
  })
  itemIndex?: number;

  @ApiPropertyOptional({
    type: Number,
    description: '`KPI_TEMPLATE_DUPLICATE_ITEM`: tekrar edilen eleman.',
  })
  duplicateOf?: number;

  @ApiPropertyOptional({
    type: String,
    description: '`KPI_TEMPLATE_INVALID_INPUT`: hatalı alan yolu.',
  })
  path?: string;

  @ApiPropertyOptional({
    type: Number,
    isArray: true,
    description: "`KPI_TEMPLATE_UNKNOWN_STORE`: bulunamayan mağaza id'leri.",
  })
  storeIds?: number[];
}

export interface KpiTemplateItemStats {
  itemCount: number;
  totalWeight: number;
}

export function toKpiTemplateSummary(
  template: KpiTemplateEntity,
  stats: KpiTemplateItemStats | undefined,
): KpiTemplateSummaryResponse {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    isActive: template.isActive,
    itemCount: stats?.itemCount ?? 0,
    totalWeight: stats?.totalWeight ?? 0,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}

function toItemResponse(item: KpiTemplateItemEntity): KpiTemplateItemResponse {
  const definition = item.definition;

  if (!definition) {
    throw new Error(`kpi_template_items[${item.id}] was loaded without its definition.`);
  }

  return {
    id: item.id,
    kpiDefinitionId: item.kpiDefinitionId,
    definition: {
      id: definition.id,
      code: definition.code,
      name: readKpiDefinitionName(definition),
      scope: definition.scope,
      unit: definition.unit,
      inputMode: definition.inputMode,
    },
    weight: item.weight,
    targetValue: item.targetValue,
    inputValues: JSON.parse(item.inputValues) as Record<string, unknown>,
    sortOrder: item.sortOrder,
  };
}

export function toKpiTemplateResponse(
  template: KpiTemplateEntity,
  items: KpiTemplateItemEntity[],
): KpiTemplateResponse {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    isActive: template.isActive,
    totalWeight: sumWeights(items.map((item) => item.weight)),
    items: items.map(toItemResponse),
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
