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

import { EmployeeEntity } from '../../employees/entities/employee.entity.js';

@Entity({ name: 'device_sessions', schema: 'dbo' })
@Index('UX_device_sessions_employee_device', ['employeeId', 'deviceId'], { unique: true })
@Index('IX_device_sessions_active_employee', ['employeeId', 'expiresAt'], {
  where: '[revoked_at] IS NULL',
})
export class DeviceSessionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'employee_id', type: 'uniqueidentifier' })
  employeeId: string;

  @ManyToOne(() => EmployeeEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'id' })
  employee: EmployeeEntity;

  @Column({ name: 'device_id', type: 'nvarchar', length: 128 })
  deviceId: string;

  @Column({ name: 'device_name', type: 'nvarchar', length: 255, nullable: true })
  deviceName: string | null;

  @Column({ name: 'user_agent', type: 'nvarchar', length: 1024, nullable: true })
  userAgent: string | null;

  @Column({ name: 'ip_address', type: 'nvarchar', length: 45, nullable: true })
  ipAddress: string | null;

  @Column({ name: 'refresh_token_hash', type: 'nvarchar', length: 255, select: false })
  refreshTokenHash: string;

  @Column({ name: 'token_family_id', type: 'uniqueidentifier' })
  tokenFamilyId: string;

  @Column({ name: 'token_version', type: 'int', default: 1 })
  tokenVersion: number;

  @Column({ name: 'remember_me', type: 'bit', default: true })
  rememberMe: boolean;

  @Column({ name: 'expires_at', type: 'datetime2', precision: 3 })
  expiresAt: Date;

  @Column({ name: 'last_seen_at', type: 'datetime2', precision: 3 })
  lastSeenAt: Date;

  @Column({ name: 'revoked_at', type: 'datetime2', precision: 3, nullable: true })
  revokedAt: Date | null;

  @Column({ name: 'revocation_reason', type: 'nvarchar', length: 255, nullable: true })
  revocationReason: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2', precision: 3 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', precision: 3 })
  updatedAt: Date;
}
