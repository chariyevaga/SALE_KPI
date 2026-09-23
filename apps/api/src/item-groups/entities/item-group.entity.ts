import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Read-only mapping of the `dbo.item_groups` view (Tiger `LG_xxx_ITEMS.STGRPCODE`, migration
 * 1799704000000, ADR-045): the non-empty item group codes of the configured firm, trimmed
 * and upper-case. Never written to; `synchronize: false` keeps it out of generated migrations.
 */
@Entity({ name: 'item_groups', schema: 'dbo', synchronize: false })
export class ItemGroupEntity {
  @PrimaryColumn({ name: 'code', type: 'nvarchar', length: 25 })
  code: string;

  @Column({ name: 'item_count', type: 'int' })
  itemCount: number;
}
