import { Column, Entity, PrimaryColumn } from 'typeorm';

/**
 * Read-only mapping of the `dbo.erp_employees` view (TIGERDB `LG_SLSMAN`, see
 * migration 1799702900000). Never written to by the application.
 */
@Entity({ name: 'erp_employees', schema: 'dbo' })
export class ErpEmployeeEntity {
  @PrimaryColumn({ name: 'id', type: 'int' })
  id: number;

  @Column({ name: 'firm_nr', type: 'int' })
  firmNr: number;

  @Column({ name: 'code', type: 'nvarchar', length: 255, nullable: true })
  code: string | null;

  @Column({ name: 'name', type: 'nvarchar', length: 255, nullable: true })
  name: string | null;

  @Column({ name: 'phone_number', type: 'nvarchar', length: 255, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'specode', type: 'nvarchar', length: 255, nullable: true })
  specode: string | null;

  @Column({ name: 'is_active', type: 'bit' })
  isActive: boolean;
}
