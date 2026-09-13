import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { FileEntity } from './entities/file.entity.js';
import { FileSourceReferenceRegistry } from './file-source-reference.registry.js';
import { FileStorageService } from './file-storage.service.js';
import { FilesController } from './files.controller.js';
import { FilesService } from './files.service.js';
import { OrphanFilesCleanupService } from './orphan-files-cleanup.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([FileEntity]), AuthModule],
  controllers: [FilesController],
  providers: [
    FileStorageService,
    FileSourceReferenceRegistry,
    FilesService,
    OrphanFilesCleanupService,
  ],
  exports: [FileSourceReferenceRegistry, FilesService],
})
export class FilesModule {}
