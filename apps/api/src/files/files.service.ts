import { createReadStream, type ReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { EntityManager } from 'typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { FileEntity } from './entities/file.entity.js';
import { FileSourceReferenceRegistry } from './file-source-reference.registry.js';
import { FileStorageService } from './file-storage.service.js';
import type { AttachFileToSourceInput, FileImageVariant, FileResponse } from './files.types.js';

export interface FileContent {
  stream: ReadStream;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly filesRepository: Repository<FileEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(FileStorageService) private readonly storage: FileStorageService,
    @Inject(FileSourceReferenceRegistry)
    private readonly sourceReferences: FileSourceReferenceRegistry,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async create(upload: Express.Multer.File): Promise<FileResponse> {
    const originalName = this.normalizeOriginalName(upload.originalname);
    const stored = await this.storage.storeImage(upload.buffer, upload.mimetype);

    const file = this.filesRepository.create({
      originalName,
      fileName: stored.fileName,
      bigImage: stored.bigImage,
      mediumImage: stored.mediumImage,
      smallImage: stored.smallImage,
      blurhash: stored.blurhash,
      mimeType: stored.mimeType,
      sizeBytes: upload.size,
      sourceTable: null,
      sourceField: null,
      sourceTableId: null,
    });

    try {
      const savedFile = await this.audit.insert(this.dataSource.manager, FileEntity, {
        originalName: file.originalName,
        fileName: file.fileName,
        bigImage: file.bigImage,
        mediumImage: file.mediumImage,
        smallImage: file.smallImage,
        blurhash: file.blurhash,
        mimeType: file.mimeType,
        sizeBytes: file.sizeBytes,
        sourceTable: null,
        sourceField: null,
        sourceTableId: null,
      });
      return this.toResponse(savedFile);
    } catch (error: unknown) {
      await this.storage.delete(file);
      throw error;
    }
  }

  async getContent(id: string, variant: FileImageVariant): Promise<FileContent> {
    const file = await this.findOneOrFail(id);
    const fileName = this.getVariantFileName(file, variant);
    const filePath = await this.storage.getReadablePath(fileName, file.sourceTable);
    const fileStats = await stat(filePath);

    return {
      stream: createReadStream(filePath),
      mimeType: file.mimeType,
      sizeBytes: fileStats.size,
    };
  }

  async requestDeletion(id: string): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await this.detachFromSource(manager, id);
    });
  }

  async detachFromSource(manager: EntityManager, fileId: string): Promise<void> {
    const file = await this.findOneWithWriteLock(manager, fileId);
    const previousSource = {
      table: file.sourceTable,
      field: file.sourceField,
      id: file.sourceTableId,
    };

    await this.sourceReferences.clearReference(manager, file);
    await this.storage.move(file, null);

    file.sourceTable = null;
    file.sourceField = null;
    file.sourceTableId = null;

    try {
      await this.writeSource(manager, file);
    } catch (error: unknown) {
      await this.storage.move(file, previousSource.table);
      file.sourceTable = previousSource.table;
      file.sourceField = previousSource.field;
      file.sourceTableId = previousSource.id;
      throw error;
    }
  }

  /**
   * Owning modules call this inside the same transaction that writes their
   * avatar_id/file_id column. If no file id is supplied by a create/update
   * request, this method must not be called and the upload remains orphaned.
   */
  async attachToSource(manager: EntityManager, input: AttachFileToSourceInput): Promise<void> {
    this.validateSourceReference(input);
    this.sourceReferences.assertRegistered(input.sourceTable, input.sourceField);

    const file = await this.findOneWithWriteLock(manager, input.fileId);

    if (
      file.sourceTableId !== null &&
      (file.sourceTable !== input.sourceTable ||
        file.sourceField !== input.sourceField ||
        file.sourceTableId !== input.sourceTableId)
    ) {
      throw new ConflictException('The file is already attached to another source.');
    }

    // Only one file may occupy a source slot (UX_files_source_reference). Releasing the
    // previous occupant here also heals rows the owning record no longer points at.
    const occupant = await manager.getRepository(FileEntity).findOne({
      where: {
        sourceField: input.sourceField,
        sourceTable: input.sourceTable,
        sourceTableId: input.sourceTableId,
      },
    });

    if (occupant && occupant.id !== input.fileId) {
      await this.detachFromSource(manager, occupant.id);
    }

    const previousSource = {
      table: file.sourceTable,
      field: file.sourceField,
      id: file.sourceTableId,
    };
    await this.storage.move(file, input.sourceTable);

    file.sourceTable = input.sourceTable;
    file.sourceField = input.sourceField;
    file.sourceTableId = input.sourceTableId;

    try {
      await this.writeSource(manager, file);
    } catch (error: unknown) {
      await this.storage.move(file, previousSource.table);
      file.sourceTable = previousSource.table;
      file.sourceField = previousSource.field;
      file.sourceTableId = previousSource.id;
      throw error;
    }
  }

  async listOrphanIds(): Promise<string[]> {
    const files = await this.filesRepository.find({
      select: { id: true },
      where: { sourceTableId: IsNull() },
      order: { createdAt: 'ASC' },
    });

    return files.map((file) => file.id);
  }

  async purgeOrphan(id: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(FileEntity);
      const file = await repository
        .createQueryBuilder('file')
        .setLock('pessimistic_write')
        .where('file.id = :id', { id })
        .andWhere('file.sourceTableId IS NULL')
        .getOne();

      if (!file) {
        return false;
      }

      await this.storage.delete(file);
      await this.audit.delete(manager, FileEntity, { id: file.id });
      return true;
    });
  }

  private async writeSource(manager: EntityManager, file: FileEntity): Promise<void> {
    await this.audit.update(
      manager,
      FileEntity,
      { id: file.id },
      {
        sourceTable: file.sourceTable,
        sourceField: file.sourceField,
        sourceTableId: file.sourceTableId,
      },
    );
  }

  private async findOneOrFail(id: string): Promise<FileEntity> {
    const file = await this.filesRepository.findOneBy({ id });

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    return file;
  }

  private async findOneWithWriteLock(manager: EntityManager, id: string): Promise<FileEntity> {
    const file = await manager
      .getRepository(FileEntity)
      .createQueryBuilder('file')
      .setLock('pessimistic_write')
      .where('file.id = :id', { id })
      .getOne();

    if (!file) {
      throw new NotFoundException('File not found.');
    }

    return file;
  }

  private normalizeOriginalName(originalName: string): string {
    const normalized = [...originalName.normalize('NFC')]
      .filter((character) => {
        const codePoint = character.codePointAt(0) ?? 0;
        return codePoint > 31 && codePoint !== 127;
      })
      .join('')
      .trim();

    if (!normalized) {
      throw new BadRequestException('The uploaded file must have a valid name.');
    }

    return normalized.slice(0, 255);
  }

  private validateSourceReference(input: AttachFileToSourceInput): void {
    const values: Array<[string, string]> = [
      ['fileId', input.fileId],
      ['sourceTable', input.sourceTable],
      ['sourceField', input.sourceField],
      ['sourceTableId', input.sourceTableId],
    ];

    for (const [name, value] of values) {
      if (!value.trim() || value.length > 128) {
        throw new BadRequestException(`${name} must contain between 1 and 128 characters.`);
      }
    }
  }

  private toResponse(file: FileEntity): FileResponse {
    return {
      id: file.id,
      originalName: file.originalName,
      fileName: file.fileName,
      mimeType: file.mimeType,
      sizeBytes: file.sizeBytes,
      sizeKb: Number((file.sizeBytes / 1024).toFixed(2)),
      blurhash: file.blurhash,
      sourceTable: file.sourceTable,
      sourceField: file.sourceField,
      sourceTableId: file.sourceTableId,
      contentUrl: this.getContentUrl(file.id, 'original'),
      bigImageUrl: file.bigImage ? this.getContentUrl(file.id, 'big') : null,
      mediumImageUrl: file.mediumImage ? this.getContentUrl(file.id, 'medium') : null,
      smallImageUrl: file.smallImage ? this.getContentUrl(file.id, 'small') : null,
      createdAt: file.createdAt.toISOString(),
    };
  }

  private getVariantFileName(file: FileEntity, variant: FileImageVariant): string {
    const fileName = {
      original: file.fileName,
      big: file.bigImage,
      medium: file.mediumImage,
      small: file.smallImage,
    }[variant];

    if (!fileName) {
      throw new NotFoundException(`The ${variant} image variant does not exist.`);
    }

    return fileName;
  }

  private getContentUrl(id: string, variant: FileImageVariant): string {
    return `/files/${id}/content?variant=${variant}`;
  }
}
