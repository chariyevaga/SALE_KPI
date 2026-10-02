import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiProduces,
  ApiTags,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { AuthService } from '../auth/auth.service.js';
import { ConfirmPasswordDto } from '../auth/dto/confirm-password.dto.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { ExportKpiPeriodDto } from './dto/export-kpi-period.dto.js';
import { ListKpiPeriodsQueryDto, SaveKpiPeriodDto } from './dto/save-kpi-period.dto.js';
import { KpiPeriodExportService } from './kpi-period-export.service.js';
import {
  KpiPeriodErrorResponse,
  KpiPeriodListResponse,
  KpiPeriodResponse,
} from './kpi-period-response.js';
import { KpiPeriodsService } from './kpi-periods.service.js';

const PASSWORD_REJECTED =
  '`AUTH_PASSWORD_CONFIRMATION_FAILED`: şifre eşleşmedi (401 değil: oturum geçerlidir).';
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const PASSWORD_LOCKED =
  '`AUTH_TOO_MANY_ATTEMPTS`: 15 dakikada 5 yanlış şifre; `retryAfterSeconds` kadar beklenir.';

@ApiTags('kpi-periods')
@ApiBearerAuth('access-token')
@Controller('kpi-periods')
@UseGuards(AccessTokenGuard)
export class KpiPeriodsController {
  constructor(
    @Inject(KpiPeriodsService) private readonly kpiPeriodsService: KpiPeriodsService,
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(KpiPeriodExportService) private readonly exportService: KpiPeriodExportService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'KPI dönemlerini yeniden eskiye, sayfalı listeler.',
    description:
      'Oturum açmış her kullanıcıya açıktır. Her satırda dönemin plan sayısı ve hedefi eksik plan sayısı döner.',
  })
  @ApiOkResponse({ type: KpiPeriodListResponse })
  list(@Query() query: ListKpiPeriodsQueryDto): Promise<KpiPeriodListResponse> {
    return this.kpiPeriodsService.list(query);
  }

  @Post()
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verilen ayın dönemini döner, yoksa açar (yalnız full_access).',
    description: 'Aynı ay için ikinci kez çağrıldığında var olan dönemi döndürür.',
  })
  @ApiBody({ type: SaveKpiPeriodDto })
  @ApiOkResponse({ type: KpiPeriodResponse })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  ensure(@Body() dto: SaveKpiPeriodDto): Promise<KpiPeriodResponse> {
    return this.kpiPeriodsService.ensure(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Tek dönemi döner.' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPeriodResponse })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  get(@Param('id', new ParseUUIDPipe()) id: string): Promise<KpiPeriodResponse> {
    return this.kpiPeriodsService.get(id);
  }

  @Post(':id/export')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dönemin KPI ve maaş Excel dosyasını indirir (yalnız full_access, ADR-059).',
    description:
      'Gövdede oturum sahibinin kendi şifresi istenir (ADR-053). Dosya adı `<dönem>_KPI_<kullanıcı adı>.xlsx`. Sayfalar: özet (plan başına ERP kodu, ad, soyad, kullanıcı adı, görev, mağaza, şablon, KPI puanı, maaş ve dönemde alınacak tutar), KPI ayrıntıları (her plan satırının hedefi, gerçekleşeni, puanı ve maaştaki payı) ve bilgi. Puanlar saklanmış sonuçlardır; yeniden hesap yapılmaz. Her indirme dönemin kayıt izine `export` olarak yazılır.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: ExportKpiPeriodDto })
  @ApiProduces(XLSX_TYPE)
  @ApiOkResponse({ description: '.xlsx dosyası.', schema: { type: 'string', format: 'binary' } })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  @ApiBadRequestResponse({ description: PASSWORD_REJECTED })
  @ApiTooManyRequestsResponse({ description: PASSWORD_LOCKED })
  async export(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ExportKpiPeriodDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    await this.authService.confirmOwnPassword(request.employee.id, dto.password);

    const file = await this.exportService.export(id, request.employee, dto.lang ?? 'tr');

    return new StreamableFile(file.content, {
      type: XLSX_TYPE,
      disposition: `attachment; filename="${file.fileName}"`,
      length: file.content.length,
    });
  }

  @Post(':id/close')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dönemi kapatır (yalnız full_access).',
    description:
      'Kapalı dönemde plan ve hedef değiştirilemez; ayı bittikten sonraki 10 gün içinde yeniden açılabilir (ADR-044). Gövdede oturum sahibinin kendi şifresi istenir (ADR-053).',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPeriodResponse })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  @ApiConflictResponse({ description: 'Dönem zaten kapalı.', type: KpiPeriodErrorResponse })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  @ApiBody({ type: ConfirmPasswordDto })
  @ApiBadRequestResponse({ description: PASSWORD_REJECTED })
  @ApiTooManyRequestsResponse({ description: PASSWORD_LOCKED })
  async close(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmPasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<KpiPeriodResponse> {
    await this.authService.confirmOwnPassword(request.employee.id, dto.password);

    return this.kpiPeriodsService.close(id);
  }

  @Post(':id/reopen')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Yanlışlıkla kapatılan dönemi yeniden açar (yalnız full_access, ADR-044).',
    description:
      'Dönemin ayı bittikten sonraki 10. günün sonuna kadar (UTC) yapılabilir; `reopenableUntil` son günü söyler. Sonrasında kapanış kesindir. Açılan dönemde plan, hedef ve hesaplama yeniden yazılabilir. Gövdede oturum sahibinin kendi şifresi istenir (ADR-053).',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPeriodResponse })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  @ApiConflictResponse({
    description:
      'Dönem zaten açık (`KPI_PERIOD_OPEN`) ya da yeniden açma süresi geçti (`KPI_PERIOD_REOPEN_EXPIRED`, `reopenableUntil` döner).',
    type: KpiPeriodErrorResponse,
  })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  @ApiBody({ type: ConfirmPasswordDto })
  @ApiBadRequestResponse({ description: PASSWORD_REJECTED })
  @ApiTooManyRequestsResponse({ description: PASSWORD_LOCKED })
  async reopen(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: ConfirmPasswordDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<KpiPeriodResponse> {
    await this.authService.confirmOwnPassword(request.employee.id, dto.password);

    return this.kpiPeriodsService.reopen(id);
  }
}
