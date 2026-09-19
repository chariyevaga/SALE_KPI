import { ApiProperty } from '@nestjs/swagger';

import { AUDIT_ACTIONS, type AuditAction, type AuditChanges } from './audit-changes.js';
import type { AuditLogEntity } from './entities/audit-log.entity.js';

/** Employee who made a change; `null` in the responses below means the system. */
export class AuditActorResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, example: 'admin' })
  username: string;

  @ApiProperty({ type: String, example: 'Ayşe' })
  firstname: string;

  @ApiProperty({ type: String, example: 'Yılmaz' })
  lastname: string;
}

export class AuditLogResponse {
  @ApiProperty({ type: String, example: '1042', description: 'bigint; metin olarak döner.' })
  id: string;

  @ApiProperty({ type: String, example: 'employees' })
  tableName: string;

  @ApiProperty({ type: String, format: 'uuid' })
  recordId: string;

  @ApiProperty({ type: String, enum: AUDIT_ACTIONS })
  action: AuditAction;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    example: {
      firstname: { old: 'Ayşe', new: 'Ayşegül' },
      isActive: { old: true, new: false },
      passwordHash: { redacted: true },
    },
    description:
      'Alan adı (API/entity alan adı) → `{ old?, new? }`. Oluşturmada yalnız `new`, silmede yalnız `old` bulunur. Gizli alanlar değer yerine `{ redacted: true }` taşır.',
  })
  changes: AuditChanges;

  @ApiProperty({
    type: Object,
    additionalProperties: true,
    nullable: true,
    example: { via: 'bulk-status' },
    description:
      'Değişikliğin nasıl yapıldığı: `via` (`bulk-status`, `bulk-copy`), `copiedFrom`, `event` …',
  })
  context: Record<string, unknown> | null;

  @ApiProperty({
    type: () => AuditActorResponse,
    nullable: true,
    description: 'Değişikliği yapan çalışan; `null` sistem işidir (migration, zamanlanmış görev).',
  })
  actor: AuditActorResponse | null;

  @ApiProperty({
    type: String,
    format: 'uuid',
    nullable: true,
    description: 'Aynı HTTP isteğinde yazılan kayıtlar aynı değeri taşır.',
  })
  requestId: string | null;

  @ApiProperty({ type: String, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;
}

export class AuditLogListResponse {
  @ApiProperty({ type: () => AuditLogResponse, isArray: true, description: 'Yeniden eskiye.' })
  items: AuditLogResponse[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;
}

export class RecordInfoResponse {
  @ApiProperty({ type: String, example: 'employees' })
  tableName: string;

  @ApiProperty({ type: String, format: 'uuid' })
  recordId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({
    type: () => AuditActorResponse,
    nullable: true,
    description: '`null`: sistem ya da kayıt izi tutulmaya başlamadan önce oluşmuş kayıt.',
  })
  createdBy: AuditActorResponse | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: () => AuditActorResponse, nullable: true })
  updatedBy: AuditActorResponse | null;
}

export function toAuditLogResponse(
  log: AuditLogEntity,
  actor: AuditActorResponse | null,
): AuditLogResponse {
  return {
    id: String(log.id),
    tableName: log.tableName,
    recordId: log.recordId,
    action: log.action,
    changes: JSON.parse(log.changes) as AuditChanges,
    context: log.context ? (JSON.parse(log.context) as Record<string, unknown>) : null,
    actor,
    requestId: log.requestId,
    ipAddress: log.ipAddress,
    createdAt: log.createdAt.toISOString(),
  };
}
