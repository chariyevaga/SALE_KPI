import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import {
  FileSourceReferenceRegistry,
  type FileSourceReferenceHandler,
} from '../files/file-source-reference.registry.js';
import { EmployeeEntity } from './entities/employee.entity.js';

@Injectable()
export class EmployeeAvatarFileReferenceHandler
  implements FileSourceReferenceHandler, OnModuleInit
{
  readonly sourceTable = 'employees';
  readonly sourceField = 'avatar_id';

  constructor(@Inject(FileSourceReferenceRegistry) private readonly registry: FileSourceReferenceRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async clearReference(
    manager: EntityManager,
    sourceTableId: string,
    fileId: string,
  ): Promise<void> {
    await manager
      .getRepository(EmployeeEntity)
      .createQueryBuilder()
      .update(EmployeeEntity)
      .set({ avatarId: null })
      .where('id = :sourceTableId', { sourceTableId })
      .andWhere('avatar_id = :fileId', { fileId })
      .execute();
  }
}
