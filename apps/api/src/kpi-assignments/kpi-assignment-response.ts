import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { readKpiDefinitionName } from '../kpi-definitions/kpi-definition-response.js';
import { KPI_PERIOD_STATUSES } from '../kpi-periods/entities/kpi-period.entity.js';
import type {
  KpiPeriodEntity,
  KpiPeriodStatus,
} from '../kpi-periods/entities/kpi-period.entity.js';
import { periodLabel } from '../kpi-periods/kpi-period-rules.js';
import { KpiTemplateDefinitionResponse } from '../kpi-templates/kpi-template-response.js';
import { sumWeights } from '../kpi-templates/kpi-template-rules.js';
import type { KpiAssignmentItemEntity } from './entities/kpi-assignment-item.entity.js';
import type { KpiAssignmentEntity } from './entities/kpi-assignment.entity.js';
import {
  KPI_ASSIGNMENT_ERROR_CODES,
  type KpiAssignmentErrorCode,
} from './kpi-assignment-errors.js';

export class KpiAssignmentEmployeeResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  username: string;

  @ApiProperty({ type: String })
  firstname: string;

  @ApiProperty({ type: String })
  lastname: string;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Tiger satış personeli referansı; `EMPLOYEE_*` KPI için zorunludur.',
  })
  erpEmployeeId: number | null;
}

export class KpiAssignmentPeriodResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Number, example: 2026 })
  year: number;

  @ApiProperty({ type: Number, example: 9 })
  month: number;

  @ApiProperty({ type: String, example: '2026-09' })
  label: string;

  @ApiProperty({ type: String, enum: KPI_PERIOD_STATUSES })
  status: KpiPeriodStatus;
}

export class KpiAssignmentItemResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, format: 'uuid' })
  kpiDefinitionId: string;

  @ApiProperty({ type: () => KpiTemplateDefinitionResponse })
  definition: KpiTemplateDefinitionResponse;

  @ApiProperty({ type: Number, example: 40 })
  weight: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 347621,
    description: '`null`: hedef henüz girilmedi.',
  })
  targetValue: number | null;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    example: { storeIds: [6], currency: 'TMT' },
    description: 'Şablondan kopyalanan girdiler; planda değişmez.',
  })
  inputValues: Record<string, unknown>;

  @ApiProperty({ type: Number, example: 1 })
  sortOrder: number;
}

export class KpiAssignmentResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: () => KpiAssignmentPeriodResponse })
  period: KpiAssignmentPeriodResponse;

  @ApiProperty({ type: () => KpiAssignmentEmployeeResponse })
  employee: KpiAssignmentEmployeeResponse;

  @ApiProperty({ type: String, format: 'uuid' })
  templateId: string;

  @ApiProperty({
    type: String,
    example: 'MÜDÜR KPI 01',
    description: 'Şablonun atama anındaki adı.',
  })
  templateName: string;

  @ApiProperty({ type: Number, example: 100 })
  totalWeight: number;

  @ApiProperty({ type: () => KpiAssignmentItemResponse, isArray: true })
  items: KpiAssignmentItemResponse[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class KpiAssignmentSummaryResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: () => KpiAssignmentEmployeeResponse })
  employee: KpiAssignmentEmployeeResponse;

  @ApiProperty({ type: String, format: 'uuid' })
  templateId: string;

  @ApiProperty({ type: String })
  templateName: string;

  @ApiProperty({ type: Number, example: 5 })
  itemCount: number;

  @ApiProperty({ type: Number, example: 3, description: 'Hedefi girilmiş KPI sayısı.' })
  targetCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class KpiAssignmentListResponse {
  @ApiProperty({ type: () => KpiAssignmentSummaryResponse, isArray: true })
  items: KpiAssignmentSummaryResponse[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;
}

export const KPI_ASSIGNMENT_SKIP_REASONS = [
  'already-assigned',
  'inactive',
  'missing-erp-link',
] as const;

export type KpiAssignmentSkipReason = (typeof KPI_ASSIGNMENT_SKIP_REASONS)[number];

export class KpiAssignmentSkippedResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  employeeId: string;

  @ApiProperty({ type: String, enum: KPI_ASSIGNMENT_SKIP_REASONS })
  reason: KpiAssignmentSkipReason;
}

export class KpiAssignmentCopyResponse {
  @ApiProperty({ type: Number, example: 6, description: 'Oluşturulan plan sayısı.' })
  created: number;

  @ApiProperty({ type: () => KpiAssignmentSkippedResponse, isArray: true })
  skipped: KpiAssignmentSkippedResponse[];
}

export class KpiMyPlanResponse {
  @ApiProperty({
    type: () => KpiAssignmentResponse,
    nullable: true,
    description: 'Çalışanın planı; yoksa `null`.',
  })
  plan: KpiAssignmentResponse | null;
}

export class KpiAssignmentRecommendationResponse {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_assignment_items.id`' })
  itemId: string;

  @ApiProperty({ type: Number, example: 6, description: 'Raporda veri bulunan ay sayısı.' })
  monthCount: number;

  @ApiProperty({ type: Number, nullable: true, example: 302325.25 })
  average: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 392918 })
  achievableMax: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 347621 })
  recommended: number | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'Birden fazla mağaza seçili olduğu için değerler toplanarak bulundu.',
  })
  combined?: boolean;
}

export class KpiAssignmentRecommendationsResponse {
  @ApiProperty({
    type: () => KpiAssignmentRecommendationResponse,
    isArray: true,
    description: 'Yalnız raporu ve verisi olan KPI satırları döner (docs/REPORTS.md).',
  })
  items: KpiAssignmentRecommendationResponse[];
}

export class KpiAssignmentErrorResponse {
  @ApiProperty({ type: Number, example: 409 })
  statusCode: number;

  @ApiProperty({ type: String, example: 'Conflict' })
  error: string;

  @ApiProperty({ type: String, example: 'These employees already have a plan in this period.' })
  message: string;

  @ApiProperty({ type: String, enum: KPI_ASSIGNMENT_ERROR_CODES })
  code: KpiAssignmentErrorCode;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    format: 'uuid',
    description: '`KPI_ASSIGNMENT_EXISTS`: planı olan çalışanlar.',
  })
  employeeIds?: string[];

  @ApiPropertyOptional({
    type: () => KpiAssignmentSkippedResponse,
    isArray: true,
    description: '`KPI_ASSIGNMENT_INELIGIBLE`: plan verilemeyen çalışanlar ve nedenleri.',
  })
  employees?: KpiAssignmentSkippedResponse[];

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: '`KPI_ASSIGNMENT_UNKNOWN_ITEM` / `KPI_ASSIGNMENT_INVALID_TARGET`: ilgili satır.',
  })
  itemId?: string;
}

export function toKpiAssignmentEmployee(employee: EmployeeEntity): KpiAssignmentEmployeeResponse {
  return {
    id: employee.id,
    username: employee.username,
    firstname: employee.firstname,
    lastname: employee.lastname,
    isActive: employee.isActive,
    erpEmployeeId: employee.erpEmployeeId,
  };
}

export function toKpiAssignmentPeriod(period: KpiPeriodEntity): KpiAssignmentPeriodResponse {
  return {
    id: period.id,
    year: period.year,
    month: period.month,
    label: periodLabel(period),
    status: period.status,
  };
}

function toItemResponse(item: KpiAssignmentItemEntity): KpiAssignmentItemResponse {
  const definition = item.definition;

  if (!definition) {
    throw new Error(`kpi_assignment_items[${item.id}] was loaded without its definition.`);
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

export function toKpiAssignmentResponse(
  assignment: KpiAssignmentEntity,
  period: KpiPeriodEntity,
  employee: EmployeeEntity,
  items: KpiAssignmentItemEntity[],
): KpiAssignmentResponse {
  return {
    id: assignment.id,
    period: toKpiAssignmentPeriod(period),
    employee: toKpiAssignmentEmployee(employee),
    templateId: assignment.templateId,
    templateName: assignment.templateName,
    totalWeight: sumWeights(items.map((item) => item.weight)),
    items: items.map(toItemResponse),
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}

export interface KpiAssignmentItemStats {
  itemCount: number;
  targetCount: number;
}

export function toKpiAssignmentSummary(
  assignment: KpiAssignmentEntity,
  employee: EmployeeEntity,
  stats: KpiAssignmentItemStats | undefined,
): KpiAssignmentSummaryResponse {
  return {
    id: assignment.id,
    employee: toKpiAssignmentEmployee(employee),
    templateId: assignment.templateId,
    templateName: assignment.templateName,
    itemCount: stats?.itemCount ?? 0,
    targetCount: stats?.targetCount ?? 0,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
  };
}
