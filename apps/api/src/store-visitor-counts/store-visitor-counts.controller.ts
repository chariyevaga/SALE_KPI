import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiConsumes,
  ApiPayloadTooLargeResponse,
  ApiProduces,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { KpiPeriodErrorResponse } from '../kpi-periods/kpi-period-response.js';
import { memoryStorage } from 'multer';

import {
  ListStoreVisitorCountsQueryDto,
  SaveStoreVisitorCountDto,
  StoreVisitorCountTemplateQueryDto,
} from './dto/store-visitor-count.dto.js';
import {
  StoreVisitorCountErrorResponse,
  StoreVisitorCountImportErrorResponse,
  StoreVisitorCountImportResponse,
  StoreVisitorCountListResponse,
  StoreVisitorCountResponse,
} from './store-visitor-count-response.js';
import { StoreVisitorCountsService } from './store-visitor-counts.service.js';
import { MAX_IMPORT_BYTES, MAX_IMPORT_ROWS } from './visitor-count-import-rules.js';
import { VisitorCountAccessGuard } from './visitor-count.guards.js';

const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const ACCESS_FORBIDDEN =
  'Çalışanın `canEnterVisitorCounts` işareti de `full_access` yetkisi de yok.';

@ApiTags('store-visitor-counts')
@ApiBearerAuth('access-token')
@Controller('store-visitor-counts')
@UseGuards(AccessTokenGuard)
export class StoreVisitorCountsController {
  constructor(
    @Inject(StoreVisitorCountsService)
    private readonly storeVisitorCountsService: StoreVisitorCountsService,
  ) {}

  @Get()
  @UseGuards(VisitorCountAccessGuard)
  @ApiOperation({
    summary: 'Mağazaların günlük ziyaretçi sayılarını yeniden eskiye, sayfalı listeler.',
    description:
      '`canEnterVisitorCounts` işaretli çalışanlara ve `full_access` kullanıcılara açıktır. `storeId`, `from` ve `to` ile daraltılır.',
  })
  @ApiOkResponse({ type: StoreVisitorCountListResponse })
  @ApiForbiddenResponse({ description: ACCESS_FORBIDDEN })
  list(@Query() query: ListStoreVisitorCountsQueryDto): Promise<StoreVisitorCountListResponse> {
    return this.storeVisitorCountsService.list(query);
  }

  @Get('template')
  @UseGuards(VisitorCountAccessGuard)
  @ApiOperation({
    summary: 'Ziyaretçi sayısı Excel şablonunu indirir (ADR-055).',
    description:
      'Aralıktaki her gün × mağaza için bir satır; kayıtlı sayı doluysa yazılıdır. Sütunlar: A tarih, B iş yeri no, C iş yeri adı (bilgi), D ziyaretçi sayısı. İkinci sayfa mağaza listesi, üçüncüsü açıklamadır. Aralık verilmezse dün.',
  })
  @ApiProduces(XLSX_TYPE)
  @ApiOkResponse({ description: '.xlsx dosyası.', schema: { type: 'string', format: 'binary' } })
  @ApiBadRequestResponse({
    description:
      '`code`: `STORE_VISITOR_COUNT_TEMPLATE_RANGE` (aralık 1–62 gün değil ya da bugünden ileri) veya `STORE_VISITOR_COUNT_UNKNOWN_STORE`.',
    type: StoreVisitorCountErrorResponse,
  })
  @ApiForbiddenResponse({ description: ACCESS_FORBIDDEN })
  async template(@Query() query: StoreVisitorCountTemplateQueryDto): Promise<StreamableFile> {
    const file = await this.storeVisitorCountsService.template(query);

    return new StreamableFile(file.content, {
      type: XLSX_TYPE,
      disposition: `attachment; filename="${file.fileName}"`,
      length: file.content.length,
    });
  }

  @Post('import')
  @UseGuards(VisitorCountAccessGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { files: 1, fileSize: MAX_IMPORT_BYTES },
    }),
  )
  @ApiOperation({
    summary: 'Excel dosyasındaki ziyaretçi sayılarını yazar (ADR-055).',
    description: `Şablonun ilk sayfası sütun sırasıyla okunur, 1. satır başlıktır; en çok ${String(MAX_IMPORT_ROWS)} satır. Aynı mağaza ve gün için kayıt varsa sayısı değişir, yoksa oluşturulur; hepsi \`via: excel-import\` ile kayıt izine yazılır. Sayı sütunu boş satır atlanır. Bir satır bile hatalıysa hiçbir şey yazılmaz ve hatalı satırlar döner.`,
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @ApiOkResponse({ type: StoreVisitorCountImportResponse })
  @ApiBadRequestResponse({
    description:
      '`code`: `STORE_VISITOR_COUNT_IMPORT_FILE` (okunamayan dosya), `STORE_VISITOR_COUNT_IMPORT_TOO_LARGE`, `STORE_VISITOR_COUNT_IMPORT_EMPTY` ya da `STORE_VISITOR_COUNT_IMPORT_INVALID` (`rows` ve `errorCount` ile).',
    type: StoreVisitorCountImportErrorResponse,
  })
  @ApiPayloadTooLargeResponse({ description: 'Dosya 2 MB’tan büyük.' })
  @ApiForbiddenResponse({ description: ACCESS_FORBIDDEN })
  importFile(
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<StoreVisitorCountImportResponse> {
    if (!file) {
      throw new BadRequestException('A multipart file field named "file" is required.');
    }

    return this.storeVisitorCountsService.importFile(file.buffer);
  }

  @Put()
  @UseGuards(VisitorCountAccessGuard)
  @ApiOperation({
    summary: 'Bir mağazanın bir günlük ziyaretçi sayısını yazar (ADR-043).',
    description:
      '`canEnterVisitorCounts` işaretli çalışan ve `full_access` kullanıcı girer. Mağaza ve gün için kayıt yoksa oluşturulur, varsa sayısı değişir; ikisi de kayıt izine yazılır. Gelecekteki gün ve kapalı KPI dönemine düşen gün reddedilir.',
  })
  @ApiBody({ type: SaveStoreVisitorCountDto })
  @ApiOkResponse({ type: StoreVisitorCountResponse })
  @ApiBadRequestResponse({
    description:
      '`code`: `STORE_VISITOR_COUNT_UNKNOWN_STORE` ya da `STORE_VISITOR_COUNT_FUTURE_DATE`. DTO doğrulama hatalarında `code` yoktur.',
    type: StoreVisitorCountErrorResponse,
  })
  @ApiConflictResponse({
    description: 'Günün ayı kapalı bir KPI dönemi.',
    type: KpiPeriodErrorResponse,
  })
  @ApiForbiddenResponse({ description: ACCESS_FORBIDDEN })
  save(@Body() dto: SaveStoreVisitorCountDto): Promise<StoreVisitorCountResponse> {
    return this.storeVisitorCountsService.save(dto);
  }

  @Delete(':id')
  @UseGuards(VisitorCountAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Yanlış girilmiş bir günlük sayımı siler.',
    description:
      '`canEnterVisitorCounts` işaretli çalışan ve `full_access` kullanıcı siler; kapalı KPI döneminde silinmez.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Sayım silindi.' })
  @ApiNotFoundResponse({ description: 'Sayım yok.' })
  @ApiConflictResponse({
    description: 'Günün ayı kapalı bir KPI dönemi.',
    type: KpiPeriodErrorResponse,
  })
  @ApiForbiddenResponse({ description: ACCESS_FORBIDDEN })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.storeVisitorCountsService.remove(id);
  }
}
