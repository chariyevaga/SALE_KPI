import { Controller, Get, Inject, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { ListItemGroupsQueryDto } from './dto/list-item-groups-query.dto.js';
import { ItemGroupListResponse } from './item-group-response.js';
import { ItemGroupsService } from './item-groups.service.js';

@ApiTags('item-groups')
@ApiBearerAuth('access-token')
@Controller('item-groups')
@UseGuards(AccessTokenGuard)
export class ItemGroupsController {
  constructor(@Inject(ItemGroupsService) private readonly itemGroupsService: ItemGroupsService) {}

  @Get()
  @ApiOperation({
    summary: 'Tiger ürün kartlarındaki malzeme gruplarını (STGRPCODE) listeler.',
    description:
      'Oturum açmış her kullanıcıya açıktır (ADR-033). Grubu boş kartlar listelenmez; `ungroupedSalesShare` onların son 12 aylık ciro payını verir. KPI hedef formlarındaki `source: "itemGroups"` alanlarının seçenek listesidir (ADR-045).',
  })
  @ApiOkResponse({ type: ItemGroupListResponse })
  list(@Query() query: ListItemGroupsQueryDto): Promise<ItemGroupListResponse> {
    return this.itemGroupsService.list(query);
  }
}
