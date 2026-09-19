import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Read-only mapping of the `dbo.stores` view (TIGERDB `L_CAPIDIV`, see
 * migration 1799702900000). Never written to by the application;
 * `synchronize: false` keeps generated migrations from treating the view as a table.
 */
@Entity({ name: 'stores', schema: 'dbo', synchronize: false })
export class StoreEntity {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'firm_nr', type: 'int' })
  firmNr: number;

  @Column({ name: 'nr', type: 'int' })
  nr: number;

  @Column({ name: 'name', type: 'nvarchar', length: 255, nullable: true })
  name: string | null;
}
