import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { ListStoresQueryDto } from './dto/list-stores-query.dto.js';
import { StoreOptionResponse } from './store-response.js';
import { StoresService } from './stores.service.js';

@ApiTags('stores')
@ApiBearerAuth('access-token')
@Controller('stores')
@UseGuards(AccessTokenGuard)
export class StoresController {
  constructor(@Inject(StoresService) private readonly storesService: StoresService) {}

  @Get()
  @ApiOperation({
    summary: '.env FIRM_NR değerine göre filtrelenmiş Logo Tiger mağazalarını listeler.',
    description:
      'Oturum açmış her kullanıcıya açıktır (ADR-033). `search` verilirse mağaza numarasında ve adında büyük/küçük harf ve aksan duyarsız arar. KPI hedef formlarındaki `source: "stores"` alanlarının seçenek listesidir.',
  })
  @ApiOkResponse({ type: StoreOptionResponse, isArray: true })
  list(@Query() query: ListStoresQueryDto): Promise<StoreOptionResponse[]> {
    return this.storesService.list(query);
  }
}
