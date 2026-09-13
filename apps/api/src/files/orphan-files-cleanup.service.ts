import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { getFileCleanupTimeZone } from '../config/environment.js';
import { FilesService } from './files.service.js';

export const ORPHAN_FILES_CLEANUP_CRON = '0 0 1 * * *';

@Injectable()
export class OrphanFilesCleanupService {
  private readonly logger = new Logger(OrphanFilesCleanupService.name);

  constructor(@Inject(FilesService) private readonly filesService: FilesService) {}

  @Cron(ORPHAN_FILES_CLEANUP_CRON, {
    name: 'orphan-files-cleanup',
    timeZone: getFileCleanupTimeZone(),
    waitForCompletion: true,
  })
  async handleCleanup(): Promise<void> {
    const orphanIds = await this.filesService.listOrphanIds();
    let deletedCount = 0;
    let failedCount = 0;

    for (const id of orphanIds) {
      try {
        if (await this.filesService.purgeOrphan(id)) {
          deletedCount += 1;
        }
      } catch (error: unknown) {
        failedCount += 1;
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Could not purge orphan file ${id}: ${message}`);
      }
    }

    this.logger.log(
      `Orphan file cleanup finished: ${deletedCount} deleted, ${failedCount} failed.`,
    );
  }
}
