import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import type { KpiInputMode, KpiScope, KpiUnit } from '../kpi-definition.types.js';

/**
 * KPI catalog row (migration 1799703200000, ADR-032). Rows are seeded by
 * migrations only; `name` and `inputSchema` hold raw JSON that the API parses
 * with `parseLocalizedText` / `parseKpiInputSchema` before returning it.
 */
@Entity({ name: 'kpi_definitions', schema: 'dbo' })
@Index('UX_kpi_definitions_code', ['code'], { unique: true })
export class KpiDefinitionEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'code', type: 'nvarchar', length: 64 })
  code: string;

  @Column({ name: 'scope', type: 'nvarchar', length: 16 })
  scope: KpiScope;

  @Column({ name: 'unit', type: 'nvarchar', length: 16 })
  unit: KpiUnit;

  @Column({ name: 'input_mode', type: 'nvarchar', length: 16 })
  inputMode: KpiInputMode;

  @Column({ name: 'name', type: 'nvarchar', length: 1000 })
  name: string;

  @Column({ name: 'input_schema', type: 'nvarchar', length: 'MAX', default: '[]' })
  inputSchema: string;

  @Column({ name: 'sort_order', type: 'int' })
  sortOrder: number;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive: boolean;
}
