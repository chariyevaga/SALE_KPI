import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import { AuditedEntity } from '../../audit/audited-entity.js';

/**
 * How many people walked into a store on one day (migration 1799703900000, ADR-043): the
 * denominator of the conversion KPI. One row per store and day.
 */
@Entity({ name: 'store_visitor_counts', schema: 'dbo' })
@Index('UX_store_visitor_counts_store_date', ['storeId', 'visitDate'], { unique: true })
export class StoreVisitorCountEntity extends AuditedEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  /** Tiger L_CAPIDIV LOGICALREF (`dbo.stores.id`), the value KPI inputs keep in storeIds. */
  @Column({ name: 'store_id', type: 'int' })
  storeId: number;

  /** `YYYY-MM-DD`; read in UTC like every other date of the connection (useUTC). */
  @Column({ name: 'visit_date', type: 'date', utc: true })
  visitDate: string;

  @Column({ name: 'visitor_count', type: 'int' })
  visitorCount: number;
}
