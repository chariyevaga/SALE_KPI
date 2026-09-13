import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { pipeline } from 'node:stream/promises';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { memoryStorage } from 'multer';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { getFileMaxUploadBytes } from '../config/environment.js';
import { FilesService } from './files.service.js';
import { FileResponse, type FileImageVariant } from './files.types.js';

const FILE_IMAGE_VARIANTS = new Set<FileImageVariant>(['original', 'big', 'medium', 'small']);

@ApiTags('files')
@ApiBearerAuth('access-token')
@Controller('files')
@UseGuards(AccessTokenGuard)
export class FilesController {
  constructor(@Inject(FilesService) private readonly filesService: FilesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: {
        files: 1,
        fileSize: getFileMaxUploadBytes(),
      },
    }),
  )
  @ApiOperation({
    summary: 'JPEG/PNG/WEBP dosyası yükler; içerik WEBP\'ye çevrilir ve varyantlar üretilir.',
    description: 'Yüklenen dosya sahipsiz oluşturulur; bir iş kaydına bağlanana kadar gece temizliğine tabidir.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: FileResponse })
  async upload(@UploadedFile() file: Express.Multer.File | undefined): Promise<FileResponse> {
    if (!file) {
      throw new BadRequestException('A multipart file field named "file" is required.');
    }

    return this.filesService.create(file);
  }

  @Get(':id/content')
  @ApiOperation({ summary: 'Fiziksel dosya içeriğini stream eder.' })
  @ApiParam({ name: 'id', format: 'uuid' })
  @ApiQuery({ name: 'variant', required: false, enum: ['original', 'big', 'medium', 'small'] })
  async getContent(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Query('variant') requestedVariant: string | undefined,
    @Res() response: Response,
  ): Promise<void> {
    const variant = requestedVariant ?? 'original';

    if (!FILE_IMAGE_VARIANTS.has(variant as FileImageVariant)) {
      throw new BadRequestException('variant must be original, big, medium, or small.');
    }

    const content = await this.filesService.getContent(id, variant as FileImageVariant);

    response.setHeader('Content-Type', content.mimeType);
    response.setHeader('Content-Length', String(content.sizeBytes));
    response.setHeader('Cache-Control', 'private, no-store');

    await pipeline(content.stream, response);
  }

  @Delete(':id')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Dosyanın kaynak bağlantısını temizler; fiziksel içerik gece temizliğinde silinir.',
  })
  @ApiParam({ name: 'id', format: 'uuid' })
  async remove(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<{ id: string; status: 'scheduled_for_cleanup' }> {
    await this.filesService.requestDeletion(id);

    return { id, status: 'scheduled_for_cleanup' };
  }
}
