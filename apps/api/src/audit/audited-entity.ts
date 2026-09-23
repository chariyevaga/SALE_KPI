import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

/**
 * Record trail columns of every table we own (ADR-036). Only AuditService writes them:
 * `created_by`/`updated_by` hold the acting employee and are NULL for system writes
 * (migrations, cron jobs) and for rows that existed before tracking started.
 */
export abstract class AuditedEntity {
  @CreateDateColumn({ name: 'created_at', type: 'datetime2', precision: 3 })
  createdAt: Date;

  @Column({ name: 'created_by', type: 'uniqueidentifier', nullable: true })
  createdBy: string | null;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime2', precision: 3 })
  updatedAt: Date;

  @Column({ name: 'updated_by', type: 'uniqueidentifier', nullable: true })
  updatedBy: string | null;
}

/** Properties AuditService owns; callers never pass them. */
export type AuditColumnKey = keyof AuditedEntity;

export const AUDIT_COLUMN_KEYS: readonly AuditColumnKey[] = [
  'createdAt',
  'createdBy',
  'updatedAt',
  'updatedBy',
];
