import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, In, IsNull, Repository } from 'typeorm';

import { AuditService, type AuditValues } from '../audit/audit.service.js';
import { PasswordService } from '../auth/password.service.js';
import type { BulkUpdateResponse } from '../common/dto/bulk.dto.js';
import { SEARCH_COLLATION, escapeLikePattern } from '../common/sql-search.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { DeviceSessionEntity } from '../device-sessions/entities/device-session.entity.js';
import { FilesService } from '../files/files.service.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import type { UpdateOwnProfileDto } from './dto/update-own-profile.dto.js';
import type { EmployeeListResponse } from './employee-list-response.js';
import { toEmployeeResponse, type EmployeeResponse } from './employee-response.js';
import { EmployeeEntity } from './entities/employee.entity.js';

const DEFAULT_PAGE_SIZE = 20;

export interface EmployeeViewer {
  id: string;
  fullAccess: boolean;
}

function canSeeContact(viewer: EmployeeViewer, employeeId: string): boolean {
  return viewer.fullAccess || viewer.id === employeeId;
}

@Injectable()
export class EmployeesService {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(ErpEmployeeEntity)
    private readonly erpEmployeeRepository: Repository<ErpEmployeeEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(FilesService) private readonly filesService: FilesService,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(query: ListEmployeesQueryDto, viewer: EmployeeViewer): Promise<EmployeeListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;

    const builder = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.avatar', 'avatar');

    if (query.search) {
      // CI_AI collation makes the match case- and accent-insensitive, so "sukru" finds "Şükrü".
      const searchable = ['firstname', 'lastname', 'username', 'email', 'phoneNumber'];
      const conditions = searchable
        .map((field) => `employee.${field} COLLATE ${SEARCH_COLLATION} LIKE :search`)
        .join(' OR ');

      builder.andWhere(`(${conditions})`, { search: `%${escapeLikePattern(query.search)}%` });
    }

    if (query.isActive !== undefined) {
      builder.andWhere('employee.isActive = :isActive', { isActive: query.isActive });
    }

    if (query.fullAccess !== undefined) {
      builder.andWhere('employee.fullAccess = :fullAccess', { fullAccess: query.fullAccess });
    }

    if (query.hasErpLink !== undefined) {
      builder.andWhere(
        query.hasErpLink ? 'employee.erpEmployeeId IS NOT NULL' : 'employee.erpEmployeeId IS NULL',
      );
    }

    if (query.hasAvatar !== undefined) {
      builder.andWhere(
        query.hasAvatar ? 'employee.avatarId IS NOT NULL' : 'employee.avatarId IS NULL',
      );
    }

    const direction = query.order === 'desc' ? 'DESC' : 'ASC';

    if (query.sort) {
      builder.orderBy(`employee.${query.sort}`, direction);
    } else {
      builder
        .orderBy('employee.firstname', direction)
        .addOrderBy('employee.lastname', direction)
        .addOrderBy('employee.username', direction);
    }

    const [employees, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    const erpCodes = await this.resolveErpCodes(employees);

    return {
      items: employees.map((employee) =>
        toEmployeeResponse(employee, {
          erpEmployeeCode: erpCodes.get(employee.erpEmployeeId ?? -1) ?? null,
          includeContact: canSeeContact(viewer, employee.id),
        }),
      ),
      limit,
      page,
      total,
    };
  }

  async get(id: string, viewer: EmployeeViewer): Promise<EmployeeResponse> {
    const employee = await this.findOneOrFail(id);
    const erpCodes = await this.resolveErpCodes([employee]);

    return toEmployeeResponse(employee, {
      erpEmployeeCode: erpCodes.get(employee.erpEmployeeId ?? -1) ?? null,
      includeContact: canSeeContact(viewer, employee.id),
    });
  }

  /** Used after writes, which are admin-only, so contact details stay visible. */
  private async getFull(id: string): Promise<EmployeeResponse> {
    const employee = await this.findOneOrFail(id);
    const erpCodes = await this.resolveErpCodes([employee]);

    return toEmployeeResponse(employee, {
      erpEmployeeCode: erpCodes.get(employee.erpEmployeeId ?? -1) ?? null,
      includeContact: true,
    });
  }

  /** One lookup for the whole page instead of a query per employee. */
  private async resolveErpCodes(employees: EmployeeEntity[]): Promise<Map<number, string | null>> {
    const ids = [...new Set(employees.map((employee) => employee.erpEmployeeId).filter(
      (id): id is number => id !== null,
    ))];

    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.erpEmployeeRepository.find({
      select: { code: true, id: true },
      where: { id: In(ids) },
    });

    return new Map(rows.map((row) => [row.id, row.code]));
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    const passwordHash = await this.passwordService.hash(dto.password);

    try {
      const id = await this.dataSource.transaction(async (manager) => {
        const saved = await this.audit.insert(manager, EmployeeEntity, {
          avatarId: dto.avatarId ?? null,
          email: dto.email || null,
          erpEmployeeId: dto.erpEmployeeId ?? null,
          firstname: dto.firstname,
          fullAccess: dto.fullAccess ?? false,
          isActive: dto.isActive ?? true,
          lastname: dto.lastname,
          passwordHash,
          phoneNumber: dto.phoneNumber || null,
          username: dto.username,
        });

        if (saved.avatarId) {
          await this.filesService.attachToSource(manager, {
            fileId: saved.avatarId,
            sourceField: 'avatar_id',
            sourceTable: 'employees',
            sourceTableId: saved.id,
          });
        }

        return saved.id;
      });

      return this.getFull(id);
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }

  async update(id: string, dto: UpdateEmployeeDto): Promise<EmployeeResponse> {
    try {
      await this.dataSource.transaction(async (manager) => {
        const repository = manager.getRepository(EmployeeEntity);
        const employee = await repository.findOneBy({ id });

        if (!employee) {
          throw new NotFoundException('Employee not found.');
        }

        // avatarId and the avatar relation map the same column, so read whichever hydrated.
        const currentAvatarId = employee.avatarId ?? employee.avatar?.id ?? null;
        const avatarChanged = dto.avatarId !== undefined && dto.avatarId !== currentAvatarId;

        if (avatarChanged && currentAvatarId) {
          await this.filesService.detachFromSource(manager, currentAvatarId);
        }

        // A plain UPDATE keeps the avatar relation out of the write path entirely.
        const patch: AuditValues<EmployeeEntity> = {};

        if (dto.username !== undefined) patch.username = dto.username;
        if (dto.firstname !== undefined) patch.firstname = dto.firstname;
        if (dto.lastname !== undefined) patch.lastname = dto.lastname;
        if (dto.email !== undefined) patch.email = dto.email || null;
        if (dto.phoneNumber !== undefined) patch.phoneNumber = dto.phoneNumber || null;
        if (dto.erpEmployeeId !== undefined) patch.erpEmployeeId = dto.erpEmployeeId;
        if (dto.fullAccess !== undefined) patch.fullAccess = dto.fullAccess;
        if (dto.isActive !== undefined) patch.isActive = dto.isActive;
        if (dto.password !== undefined) {
          patch.passwordHash = await this.passwordService.hash(dto.password);
        }
        if (dto.avatarId !== undefined) patch.avatarId = dto.avatarId;

        if (Object.keys(patch).length > 0) {
          await this.audit.update(manager, EmployeeEntity, { id }, patch);
        }

        if (avatarChanged && dto.avatarId) {
          await this.filesService.attachToSource(manager, {
            fileId: dto.avatarId,
            sourceField: 'avatar_id',
            sourceTable: 'employees',
            sourceTableId: employee.id,
          });
        }
      });

      return this.getFull(id);
    } catch (error: unknown) {
      this.rethrowWriteError(error);
    }
  }

  /** Self-service: the caller can only ever touch their own record. */
  async updateOwnProfile(id: string, dto: UpdateOwnProfileDto): Promise<EmployeeResponse> {
    return this.update(id, dto);
  }

  async deactivate(id: string, requestingEmployeeId: string): Promise<void> {
    if (id === requestingEmployeeId) {
      throw new ConflictException('You cannot deactivate your own account.');
    }

    await this.dataSource.transaction(async (manager) => {
      const result = await this.audit.update(manager, EmployeeEntity, { id }, { isActive: false });

      if (result.matched === 0) {
        throw new NotFoundException('Employee not found.');
      }

      await this.audit.update(
        manager,
        DeviceSessionEntity,
        { employeeId: id, revokedAt: IsNull() },
        { revokedAt: new Date(), revocationReason: 'employee_deactivated' },
      );
    });
  }

  /**
   * Bulk (de)activation for the list screen (ADR-035). Deactivation revokes sessions
   * exactly like `deactivate`, and the caller can never deactivate themselves.
   */
  async setActiveMany(
    ids: string[],
    isActive: boolean,
    requestingEmployeeId: string,
  ): Promise<BulkUpdateResponse> {
    const self = requestingEmployeeId.toLowerCase();

    if (!isActive && ids.some((id) => id.toLowerCase() === self)) {
      throw new ConflictException('You cannot deactivate your own account.');
    }

    return this.dataSource.transaction((manager) => this.applyActiveMany(manager, ids, isActive));
  }

  private async applyActiveMany(
    manager: EntityManager,
    ids: string[],
    isActive: boolean,
  ): Promise<BulkUpdateResponse> {
    const context = { via: 'bulk-status' };
    // Only rows whose state actually changes are written, logged, counted and logged out.
    const { changedIds } = await this.audit.update(
      manager,
      EmployeeEntity,
      { id: In(ids) },
      { isActive },
      { context },
    );

    if (!isActive && changedIds.length > 0) {
      await this.audit.update(
        manager,
        DeviceSessionEntity,
        { employeeId: In(changedIds), revokedAt: IsNull() },
        { revokedAt: new Date(), revocationReason: 'employee_deactivated' },
        { context },
      );
    }

    return { updated: changedIds.length };
  }

  private async findOneOrFail(id: string): Promise<EmployeeEntity> {
    const employee = await this.employeeRepository.findOneBy({ id });

    if (!employee) {
      throw new NotFoundException('Employee not found.');
    }

    return employee;
  }

  private rethrowWriteError(error: unknown): never {
    if (error instanceof ConflictException || error instanceof NotFoundException) {
      throw error;
    }

    const number = (error as { driverError?: { number?: number } }).driverError?.number;

    if (number === 2_601 || number === 2_627) {
      throw new ConflictException('Username or avatar is already in use.');
    }

    throw error;
  }
}
