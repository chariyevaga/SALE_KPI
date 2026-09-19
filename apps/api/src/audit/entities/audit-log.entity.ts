import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

import type { AuditAction } from '../audit-changes.js';

/**
 * Append-only change log of every audited table (migration 1799703400000, ADR-036).
 * Rows are never updated, so the table has `created_at`/`created_by` (the actor) but no
 * `updated_*` columns — the one exception to the record trail rule.
 */
@Entity({ name: 'audit_logs', schema: 'dbo' })
@Index('IX_audit_logs_record', ['tableName', 'recordId'])
@Index('IX_audit_logs_created_by', ['createdBy'], { where: '[created_by] IS NOT NULL' })
export class AuditLogEntity {
  /** bigint identity; the driver returns it as a string. */
  @PrimaryGeneratedColumn('increment', { name: 'id', type: 'bigint' })
  id: string;

  @Column({ name: 'table_name', type: 'nvarchar', length: 128 })
  tableName: string;

  @Column({ name: 'record_id', type: 'uniqueidentifier' })
  recordId: string;

  @Column({ name: 'action', type: 'nvarchar', length: 16 })
  action: AuditAction;

  /** JSON object: `{ "<property>": { "old"?: …, "new"?: …, "redacted"?: true } }`. */
  @Column({ name: 'changes', type: 'nvarchar', length: 'MAX' })
  changes: string;

  /** JSON object with how the change happened, e.g. `{ "via": "bulk-status" }`. */
  @Column({ name: 'context', type: 'nvarchar', length: 'MAX', nullable: true })
  context: string | null;

  @Column({ name: 'request_id', type: 'uniqueidentifier', nullable: true })
  requestId: string | null;

  @Column({ name: 'ip_address', type: 'nvarchar', length: 45, nullable: true })
  ipAddress: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime2', precision: 3 })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uniqueidentifier', nullable: true })
  createdBy: string | null;
}
