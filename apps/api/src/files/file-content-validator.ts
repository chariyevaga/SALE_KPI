import { BadRequestException } from '@nestjs/common';

export const SUPPORTED_FILE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function isJpeg(buffer: Buffer): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

function isPng(buffer: Buffer): boolean {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

  return (
    buffer.length >= signature.length && signature.every((byte, index) => buffer[index] === byte)
  );
}

function isWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  );
}

export function validateFileContent(buffer: Buffer, mimeType: string): void {
  const isValid =
    (mimeType === 'image/jpeg' && isJpeg(buffer)) ||
    (mimeType === 'image/png' && isPng(buffer)) ||
    (mimeType === 'image/webp' && isWebp(buffer));

  if (!isValid) {
    throw new BadRequestException('Only valid JPEG, PNG, or WEBP image files are accepted.');
  }
}
