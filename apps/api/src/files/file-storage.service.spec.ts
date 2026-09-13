import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';

import sharp from 'sharp';

import { FileEntity } from './entities/file.entity.js';
import { FileStorageService } from './file-storage.service.js';

void test('creates independent WEBP variants without changing aspect ratio', async () => {
  const temporaryRoot = await mkdtemp(join(tmpdir(), 'retail-kpi-files-'));
  const previousRoot = process.env.FILE_STORAGE_ROOT;
  process.env.FILE_STORAGE_ROOT = temporaryRoot;

  try {
    const storage = new FileStorageService();
    const input = await sharp({
      create: {
        width: 1200,
        height: 600,
        channels: 3,
        background: '#336699',
      },
    })
      .png()
      .toBuffer();
    const stored = await storage.storeImage(input, 'image/png');
    const names = [stored.fileName, stored.bigImage, stored.mediumImage, stored.smallImage];

    assert.equal(new Set(names).size, 4);
    assert.equal(
      names.every((name) => name.endsWith('.webp')),
      true,
    );
    assert.notEqual(stored.blurhash, '');

    const originalMetadata = await sharp(
      await storage.getReadablePath(stored.fileName, null),
    ).metadata();
    const mediumMetadata = await sharp(
      await storage.getReadablePath(stored.mediumImage, null),
    ).metadata();
    const smallMetadata = await sharp(
      await storage.getReadablePath(stored.smallImage, null),
    ).metadata();

    assert.equal(originalMetadata.format, 'webp');
    assert.deepEqual([originalMetadata.width, originalMetadata.height], [1200, 600]);
    assert.deepEqual([mediumMetadata.width, mediumMetadata.height], [800, 400]);
    assert.deepEqual([smallMetadata.width, smallMetadata.height], [320, 160]);

    const file = Object.assign(new FileEntity(), {
      fileName: stored.fileName,
      bigImage: stored.bigImage,
      mediumImage: stored.mediumImage,
      smallImage: stored.smallImage,
    });
    file.sourceTable = null;
    await storage.move(file, 'employees');
    file.sourceTable = 'employees';
    await storage.getReadablePath(file.smallImage, file.sourceTable);
    await storage.delete(file);
  } finally {
    if (previousRoot === undefined) {
      delete process.env.FILE_STORAGE_ROOT;
    } else {
      process.env.FILE_STORAGE_ROOT = previousRoot;
    }

    await rm(temporaryRoot, { recursive: true, force: true });
  }
});
