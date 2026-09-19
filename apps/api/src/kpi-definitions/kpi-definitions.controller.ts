import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { ListKpiDefinitionsQueryDto } from './dto/list-kpi-definitions-query.dto.js';
import { KpiDefinitionResponse } from './kpi-definition-response.js';
import { KpiDefinitionsService } from './kpi-definitions.service.js';

@ApiTags('kpi-definitions')
@ApiBearerAuth('access-token')
@Controller('kpi-definitions')
@UseGuards(AccessTokenGuard)
export class KpiDefinitionsController {
  constructor(
    @Inject(KpiDefinitionsService) private readonly kpiDefinitionsService: KpiDefinitionsService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Aktif KPI tanımlarını ve hedef girişi form tariflerini listeler.',
    description:
      'Sıralama `sortOrder`, ardından `code` iledir. `search` verilirse kodda ve adın dört dildeki değerlerinde büyük/küçük harf ve aksan duyarsız arar. `inputSchema`, hedef girilirken istenecek alanları tarif eder; web formu bu listeden üretilir (ADR-032).',
  })
  @ApiOkResponse({ type: KpiDefinitionResponse, isArray: true })
  list(@Query() query: ListKpiDefinitionsQueryDto): Promise<KpiDefinitionResponse[]> {
    return this.kpiDefinitionsService.list(query);
  }
}
