import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, type EntityMetadata, Repository } from 'typeorm';

import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import {
  type AuditActorResponse,
  type AuditLogListResponse,
  type RecordInfoResponse,
  toAuditLogResponse,
} from './audit-log-response.js';
import { isAuditedMetadata } from './audit-rules.js';
import type { AuditedEntity } from './audited-entity.js';
import type { ListAuditLogsQueryDto } from './dto/list-audit-logs-query.dto.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

const DEFAULT_PAGE_SIZE = 20;

/** Read side of the record trail: per-record info and change history (ADR-036). */
@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly logRepository: Repository<AuditLogEntity>,
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async list(query: ListAuditLogsQueryDto): Promise<AuditLogListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    // The identity id follows insertion order, so it doubles as the time order.
    const builder = this.logRepository.createQueryBuilder('log').orderBy('log.id', 'DESC');

    if (query.tableName) {
      builder.andWhere('log.tableName = :tableName', { tableName: query.tableName });
    }

    if (query.recordId) {
      builder.andWhere('log.recordId = :recordId', { recordId: query.recordId });
    }

    if (query.actorId) {
      builder.andWhere('log.createdBy = :actorId', { actorId: query.actorId });
    }

    const [logs, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const actors = await this.resolveActors(logs.map((log) => log.createdBy));

    return {
      items: logs.map((log) => toAuditLogResponse(log, findActor(actors, log.createdBy))),
      limit,
      page,
      total,
    };
  }

  /** Who created and last changed a row of any audited table ("Kayıt bilgisi"). */
  async getRecordInfo(tableName: string, recordId: string): Promise<RecordInfoResponse> {
    const metadata = this.findAuditedTable(tableName);
    const row = await this.dataSource
      .getRepository<AuditedEntity & { id: string }>(metadata.target)
      .findOne({
        select: { id: true, createdAt: true, createdBy: true, updatedAt: true, updatedBy: true },
        where: { id: recordId },
        loadEagerRelations: false,
      });

    if (!row) {
      throw new NotFoundException('Record not found.');
    }

    const actors = await this.resolveActors([row.createdBy, row.updatedBy]);

    return {
      tableName: metadata.tableName,
      recordId: row.id,
      createdAt: row.createdAt.toISOString(),
      createdBy: findActor(actors, row.createdBy),
      updatedAt: row.updatedAt.toISOString(),
      updatedBy: findActor(actors, row.updatedBy),
    };
  }

  /** Only tables whose entity extends AuditedEntity can be asked about. */
  private findAuditedTable(tableName: string): EntityMetadata {
    const metadata = this.dataSource.entityMetadatas.find(
      (candidate) => candidate.tableName === tableName && isAuditedMetadata(candidate),
    );

    if (!metadata) {
      throw new NotFoundException(`Unknown audited table: ${tableName}.`);
    }

    return metadata;
  }

  /** One lookup for all actors on the page. */
  private async resolveActors(
    ids: readonly (string | null)[],
  ): Promise<Map<string, AuditActorResponse>> {
    const unique = [...new Set(ids.filter((id): id is string => id !== null))];

    if (unique.length === 0) {
      return new Map();
    }

    const employees = await this.employeeRepository.find({
      select: { id: true, username: true, firstname: true, lastname: true },
      where: { id: In(unique) },
      loadEagerRelations: false,
    });

    return new Map(
      employees.map((employee) => [
        employee.id.toLowerCase(),
        {
          id: employee.id,
          username: employee.username,
          firstname: employee.firstname,
          lastname: employee.lastname,
        },
      ]),
    );
  }
}

function findActor(
  actors: ReadonlyMap<string, AuditActorResponse>,
  id: string | null,
): AuditActorResponse | null {
  return id ? (actors.get(id.toLowerCase()) ?? null) : null;
}
