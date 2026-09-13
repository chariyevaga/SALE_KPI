import { randomUUID } from 'node:crypto';
import { access, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { encode } from 'blurhash';
import sharp from 'sharp';

import { getFileStorageRoot } from '../config/environment.js';
import type { FileEntity } from './entities/file.entity.js';
import { validateFileContent } from './file-content-validator.js';

const UNASSIGNED_FOLDER = '_unassigned';
const IMAGE_WIDTHS = {
  big: 1600,
  medium: 800,
  small: 320,
} as const;

export interface StoredImageSet {
  fileName: string;
  bigImage: string;
  mediumImage: string;
  smallImage: string;
  blurhash: string;
  mimeType: 'image/webp';
}

@Injectable()
export class FileStorageService {
  private readonly root = getFileStorageRoot();

  async storeImage(buffer: Buffer, declaredMimeType: string): Promise<StoredImageSet> {
    validateFileContent(buffer, declaredMimeType);

    const stored: StoredImageSet = {
      fileName: `${randomUUID()}.webp`,
      bigImage: `${randomUUID()}.webp`,
      mediumImage: `${randomUUID()}.webp`,
      smallImage: `${randomUUID()}.webp`,
      blurhash: '',
      mimeType: 'image/webp',
    };
    const image = sharp(buffer, { failOn: 'error' }).rotate();
    const [original, big, medium, small, blurhash] = await Promise.all([
      image.clone().webp({ quality: 88 }).toBuffer(),
      this.resize(image, IMAGE_WIDTHS.big),
      this.resize(image, IMAGE_WIDTHS.medium),
      this.resize(image, IMAGE_WIDTHS.small),
      this.createBlurhash(image),
    ]);
    stored.blurhash = blurhash;

    const folder = this.resolveFolder(null);
    await mkdir(folder, { recursive: true });

    const writes: Array<[string, Buffer]> = [
      [stored.fileName, original],
      [stored.bigImage, big],
      [stored.mediumImage, medium],
      [stored.smallImage, small],
    ];

    try {
      await Promise.all(
        writes.map(([fileName, content]) =>
          writeFile(this.resolveFile(null, fileName), content, { flag: 'wx' }),
        ),
      );
    } catch (error: unknown) {
      await Promise.allSettled(writes.map(([fileName]) => this.deleteOne(fileName, null)));
      throw error;
    }

    return stored;
  }

  async move(file: FileEntity, nextSourceTable: string | null): Promise<void> {
    const names = this.getFileNames(file);
    const previousSourceTable = file.sourceTable;

    if (previousSourceTable === nextSourceTable) {
      return;
    }

    await mkdir(this.resolveFolder(nextSourceTable), { recursive: true });
    const moved: string[] = [];

    try {
      for (const name of names) {
        await rename(
          this.resolveFile(previousSourceTable, name),
          this.resolveFile(nextSourceTable, name),
        );
        moved.push(name);
      }
    } catch (error: unknown) {
      await Promise.allSettled(
        moved.map((name) =>
          rename(
            this.resolveFile(nextSourceTable, name),
            this.resolveFile(previousSourceTable, name),
          ),
        ),
      );
      throw error;
    }
  }

  async delete(file: FileEntity): Promise<void> {
    await Promise.all(
      this.getFileNames(file).map((name) => this.deleteOne(name, file.sourceTable)),
    );
  }

  async getReadablePath(fileName: string, sourceTable: string | null): Promise<string> {
    const filePath = this.resolveFile(sourceTable, fileName);

    try {
      await access(filePath);
    } catch (error: unknown) {
      if (this.isNodeError(error) && error.code === 'ENOENT') {
        throw new InternalServerErrorException(
          'The file metadata exists but its content is missing.',
        );
      }

      throw error;
    }

    return filePath;
  }

  private resize(image: sharp.Sharp, width: number): Promise<Buffer> {
    return image
      .clone()
      .resize({ width, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 84 })
      .toBuffer();
  }

  private async createBlurhash(image: sharp.Sharp): Promise<string> {
    const { data, info } = await image
      .clone()
      .resize({ width: 32, height: 32, fit: 'inside', withoutEnlargement: true })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    return encode(new Uint8ClampedArray(data), info.width, info.height, 4, 3);
  }

  private getFileNames(file: FileEntity): string[] {
    return [file.fileName, file.bigImage, file.mediumImage, file.smallImage].filter(
      (value): value is string => typeof value === 'string',
    );
  }

  private async deleteOne(fileName: string, sourceTable: string | null): Promise<void> {
    try {
      await unlink(this.resolveFile(sourceTable, fileName));
    } catch (error: unknown) {
      if (this.isNodeError(error) && error.code === 'ENOENT') {
        return;
      }

      throw error;
    }
  }

  private resolveFolder(sourceTable: string | null): string {
    const folder = sourceTable ?? UNASSIGNED_FOLDER;

    if (!/^[_a-z][a-z0-9_-]{0,127}$/.test(folder)) {
      throw new InternalServerErrorException('Invalid file storage folder.');
    }

    const folderPath = resolve(this.root, folder);

    if (!folderPath.startsWith(`${this.root}${sep}`)) {
      throw new InternalServerErrorException('Invalid file storage folder.');
    }

    return folderPath;
  }

  private resolveFile(sourceTable: string | null, fileName: string): string {
    if (!/^[0-9a-f-]+\.webp$/i.test(fileName)) {
      throw new InternalServerErrorException('Invalid stored file name.');
    }

    const folder = this.resolveFolder(sourceTable);
    const filePath = resolve(folder, fileName);

    if (!filePath.startsWith(`${folder}${sep}`)) {
      throw new InternalServerErrorException('Invalid stored file name.');
    }

    return filePath;
  }

  private isNodeError(error: unknown): error is NodeJS.ErrnoException {
    return error instanceof Error && 'code' in error;
  }
}
