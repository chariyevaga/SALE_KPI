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
  Put,
  Req,
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
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { KpiAssignmentErrorResponse } from '../kpi-assignments/kpi-assignment-response.js';
import { KpiPeriodErrorResponse } from '../kpi-periods/kpi-period-response.js';
import { SaveKpiActualsDto } from './dto/save-kpi-actuals.dto.js';
import { KpiPeriodCalculationResponse, KpiPlanResultsResponse } from './kpi-result-response.js';
import { KpiResultsService } from './kpi-results.service.js';

const CLOSED_PERIOD_DESCRIPTION =
  '`KPI_PERIOD_CLOSED`: dönem kapalı; kapanmış ayın sonuçları dondurulmuştur.';

@ApiTags('kpi-results')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(AccessTokenGuard)
export class KpiResultsController {
  constructor(@Inject(KpiResultsService) private readonly kpiResultsService: KpiResultsService) {}

  @Get('kpi-assignments/:id/results')
  @ApiOperation({
    summary: 'Planın sonuçlarını ve toplam puanını döner.',
    description:
      'Planın sahibi kendi sonuçlarını görebilir; başkasının planını yalnız `full_access` okur. Hiç hesaplanmadıysa satır listesi boş ve `totalScore` `null` döner.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPlanResultsResponse })
  @ApiForbiddenResponse({ description: 'Plan başka bir çalışana ait.' })
  @ApiNotFoundResponse({ description: 'Plan bulunamadı.' })
  results(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<KpiPlanResultsResponse> {
    return this.kpiResultsService.forAssignment(id, {
      id: request.employee.id,
      fullAccess: request.employee.fullAccess,
    });
  }

  @Post('kpi-assignments/:id/calculate')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Planı dönemin ayına göre hesaplar (yalnız full_access).',
    description:
      'Tiger’dan hesaplanan KPI satırları `dbo.kpi_month_values` ile okunur, elle girilen satırların değeri korunur. Puan `docs/BUSINESS_RULES.md` "Puan hesabı" formülüdür; hedefi ya da gerçekleşeni olmayan satır puanlanmaz. Devam eden ayda sonuç ara sonuçtur (ADR-041).',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPlanResultsResponse })
  @ApiConflictResponse({
    type: KpiPeriodErrorResponse,
    description: CLOSED_PERIOD_DESCRIPTION,
  })
  @ApiNotFoundResponse({ description: 'Plan bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  calculate(@Param('id', new ParseUUIDPipe()) id: string): Promise<KpiPlanResultsResponse> {
    return this.kpiResultsService.calculate(id);
  }

  @Put('kpi-assignments/:id/actuals')
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Elle girilen KPI satırlarının gerçekleşen değerini yazar (yalnız full_access).',
    description:
      'Yalnız Tiger’dan hesaplanamayan KPI’lar (`STORE_CONVERSION`) gönderilebilir; hesaplanan bir satır gönderilirse `400 KPI_ASSIGNMENT_CALCULATED_ITEM` döner. Yazma sonrası planın puanı yeniden hesaplanır.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: SaveKpiActualsDto })
  @ApiOkResponse({ type: KpiPlanResultsResponse })
  @ApiBadRequestResponse({
    type: KpiAssignmentErrorResponse,
    description:
      '`KPI_ASSIGNMENT_UNKNOWN_ITEM` (satır bu plana ait değil) ya da `KPI_ASSIGNMENT_CALCULATED_ITEM` (satır Tiger’dan hesaplanıyor).',
  })
  @ApiConflictResponse({ type: KpiPeriodErrorResponse, description: CLOSED_PERIOD_DESCRIPTION })
  @ApiNotFoundResponse({ description: 'Plan bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  setActuals(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveKpiActualsDto,
  ): Promise<KpiPlanResultsResponse> {
    return this.kpiResultsService.setActuals(id, dto);
  }

  @Post('kpi-periods/:id/calculate')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dönemdeki bütün planları hesaplar (yalnız full_access).',
    description:
      'Tiger ayı tek sorguda okunur ve bütün planlar aynı transaction içinde yazılır. `incomplete`, hedefi ya da elle girişi eksik olduğu için puanı tamamlanmayan plan sayısıdır.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiOkResponse({ type: KpiPeriodCalculationResponse })
  @ApiConflictResponse({ type: KpiPeriodErrorResponse, description: CLOSED_PERIOD_DESCRIPTION })
  @ApiNotFoundResponse({ description: 'Dönem bulunamadı.' })
  @ApiForbiddenResponse({ description: '`full_access` yok.' })
  calculatePeriod(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<KpiPeriodCalculationResponse> {
    return this.kpiResultsService.calculatePeriod(id);
  }
}
