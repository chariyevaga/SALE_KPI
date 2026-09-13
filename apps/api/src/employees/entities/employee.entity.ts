import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { FileEntity } from '../../files/entities/file.entity.js';

@Entity({ name: 'employees', schema: 'dbo' })
@Index('UX_employees_username', ['username'], { unique: true })
@Index('IX_employees_erp_employee_id', ['erpEmployeeId'], {
  where: '[erp_employee_id] IS NOT NULL',
})
@Index('UX_employees_avatar_id', ['avatarId'], {
  unique: true,
  where: '[avatar_id] IS NOT NULL',
})
export class EmployeeEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'username', type: 'nvarchar', length: 100 })
  username: string;

  @Column({ name: 'email', type: 'nvarchar', length: 320, nullable: true })
  email: string | null;

  @Column({ name: 'password_hash', type: 'nvarchar', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'firstname', type: 'nvarchar', length: 100 })
  firstname: string;

  @Column({ name: 'lastname', type: 'nvarchar', length: 100 })
  lastname: string;

  @Column({ name: 'phone_number', type: 'nvarchar', length: 32, nullable: true })
  phoneNumber: string | null;

  @Column({ name: 'erp_employee_id', type: 'int', nullable: true })
  erpEmployeeId: number | null;

  @Column({ name: 'avatar_id', type: 'uniqueidentifier', nullable: true })
  avatarId: string | null;

  /**
   * Read-only view of avatarId: both map the same avatar_id column, and without
   * persistence:false TypeORM writes this relation's stale id back on save,
   * which silently undid avatar changes and tripped the unique index.
   */
  @ManyToOne(() => FileEntity, {
    eager: true,
    nullable: true,
    onDelete: 'SET NULL',
    persistence: false,
  })
  @JoinColumn({ name: 'avatar_id', referencedColumnName: 'id' })
  avatar: FileEntity | null;

  @Column({ name: 'is_active', type: 'bit', default: true })
  isActive: boolean;

  @Column({ name: 'full_access', type: 'bit', default: false })
  fullAccess: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', precision: 3 })
  updatedAt: Date;
}
