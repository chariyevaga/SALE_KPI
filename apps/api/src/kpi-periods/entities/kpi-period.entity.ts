import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';

export const KPI_PERIOD_STATUSES = ['open', 'closed'] as const;

export type KpiPeriodStatus = (typeof KPI_PERIOD_STATUSES)[number];

/**
 * A monthly KPI period (migration 1799703600000, ADR-039). Plans and targets are written
 * only while the period is open; closing freezes them.
 */
@Entity({ name: 'kpi_periods', schema: 'dbo' })
@Index('UX_kpi_periods_year_month', ['year', 'month'], { unique: true })
export class KpiPeriodEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'year', type: 'smallint' })
  year: number;

  @Column({ name: 'month', type: 'tinyint' })
  month: number;

  @Column({ name: 'status', type: 'nvarchar', length: 16, default: 'open' })
  status: KpiPeriodStatus;

  @Column({ name: 'closed_at', type: 'datetime2', precision: 3, nullable: true })
  closedAt: Date | null;
}
