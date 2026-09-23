import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
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
import {
  ListStoreVisitorCountsQueryDto,
  SaveStoreVisitorCountDto,
} from './dto/store-visitor-count.dto.js';
import {
  StoreVisitorCountErrorResponse,
  StoreVisitorCountListResponse,
  StoreVisitorCountResponse,
} from './store-visitor-count-response.js';
import { StoreVisitorCountsService } from './store-visitor-counts.service.js';
import { VisitorCountAccessGuard } from './visitor-count.guards.js';

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
