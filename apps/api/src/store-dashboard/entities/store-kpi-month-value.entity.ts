import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';
import { decimalTransformer } from '../../common/decimal.js';

/**
 * What one store did in one month for one store KPI (migration 1799704900000, ADR-061): a
 * copy of `dbo.kpi_month_values` that the store dashboard reads instead of Tiger. Only
 * StoreDashboardRefreshService writes it, as the system.
 */
@Entity({ name: 'store_kpi_month_values', schema: 'dbo' })
@Index(
  'UX_store_kpi_month_values_key',
  ['firmNr', 'monthStart', 'storeNr', 'kpiCode', 'currency'],
  {
    unique: true,
  },
)
export class StoreKpiMonthValueEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'firm_nr', type: 'int' })
  firmNr: number;

  /** Tiger iş yeri number (`INVOICE.BRANCH` = `L_CAPIDIV.NR`), an external reference. */
  @Column({ name: 'store_nr', type: 'int' })
  storeNr: number;

  /** `YYYY-MM-01`; read in UTC like every other date of the connection (useUTC). */
  @Column({ name: 'month_start', type: 'date', utc: true })
  monthStart: string;

  @Column({ name: 'kpi_code', type: 'nvarchar', length: 64 })
  kpiCode: string;

  /** `TMT` / `USD` for sales; null for the counts. */
  @Column({ name: 'currency', type: 'nvarchar', length: 3, nullable: true })
  currency: string | null;

  @Column({
    name: 'value',
    type: 'decimal',
    precision: 19,
    scale: 4,
    transformer: decimalTransformer,
  })
  value: number;
}
