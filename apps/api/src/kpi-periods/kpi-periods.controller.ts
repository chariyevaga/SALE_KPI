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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { ListKpiPeriodsQueryDto, SaveKpiPeriodDto } from './dto/save-kpi-period.dto.js';
import {
  KpiPeriodErrorResponse,
  KpiPeriodListResponse,
  KpiPeriodResponse,
} from './kpi-period-response.js';
import { KpiPeriodsService } from './kpi-periods.service.js';

@ApiTags('kpi-periods')
@ApiBearerAuth('access-token')
@Controller('kpi-periods')
@UseGuards(AccessTokenGuard)
export class KpiPeriodsController {
  constructor(@Inject(KpiPeriodsService) private readonly kpiPeriodsService: KpiPeriodsService) {}

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

  @Post(':id/close')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dönemi kapatır (yalnız full_access).',
    description:
      'Kapalı dönemde plan ve hedef değiştirilemez. Yeniden açma yoktur (açık iş kararı 11).',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPeriodResponse })
  @ApiNotFoundResponse({ description: 'Dönem yok.' })
  @ApiConflictResponse({ description: 'Dönem zaten kapalı.', type: KpiPeriodErrorResponse })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  close(@Param('id', new ParseUUIDPipe()) id: string): Promise<KpiPeriodResponse> {
    return this.kpiPeriodsService.close(id);
  }
}
