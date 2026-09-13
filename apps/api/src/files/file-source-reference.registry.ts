import { ConflictException, Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import type { FileEntity } from './entities/file.entity.js';

export interface FileSourceReferenceHandler {
  sourceTable: string;
  sourceField: string;
  clearReference(manager: EntityManager, sourceTableId: string, fileId: string): Promise<void>;
}

@Injectable()
export class FileSourceReferenceRegistry {
  private readonly handlers = new Map<string, FileSourceReferenceHandler>();

  register(handler: FileSourceReferenceHandler): void {
    const key = this.getKey(handler.sourceTable, handler.sourceField);

    if (this.handlers.has(key)) {
      throw new Error(`A file source handler is already registered for ${key}.`);
    }

    this.handlers.set(key, handler);
  }

  assertRegistered(sourceTable: string, sourceField: string): void {
    const key = this.getKey(sourceTable, sourceField);

    if (!this.handlers.has(key)) {
      throw new ConflictException(
        `The file source is not supported because no handler is registered for ${key}.`,
      );
    }
  }

  async clearReference(manager: EntityManager, file: FileEntity): Promise<void> {
    if (!file.sourceTable || !file.sourceField || !file.sourceTableId) {
      return;
    }

    const key = this.getKey(file.sourceTable, file.sourceField);
    const handler = this.handlers.get(key);

    if (!handler) {
      throw new ConflictException(
        `The file cannot be detached because no source handler is registered for ${key}.`,
      );
    }

    await handler.clearReference(manager, file.sourceTableId, file.id);
  }

  private getKey(sourceTable: string, sourceField: string): string {
    return `${sourceTable}.${sourceField}`;
  }
}
