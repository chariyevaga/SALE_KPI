import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { SEARCH_COLLATION, andWhereEachSearchTerm } from '../common/sql-search.js';
import type { ListItemGroupsQueryDto } from './dto/list-item-groups-query.dto.js';
import { ItemGroupEntity } from './entities/item-group.entity.js';
import type { ItemGroupListResponse } from './item-group-response.js';

@Injectable()
export class ItemGroupsService {
  constructor(
    @InjectRepository(ItemGroupEntity)
    private readonly repository: Repository<ItemGroupEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  /** The group choices of the KPI target form and how much of the sales they miss. */
  async list(query: ListItemGroupsQueryDto = {}): Promise<ItemGroupListResponse> {
    const builder = this.repository
      .createQueryBuilder('itemGroup')
      .select(['itemGroup.code', 'itemGroup.itemCount'])
      .orderBy('itemGroup.code', 'ASC');

    andWhereEachSearchTerm(builder, query.search, [
      (parameter) => `itemGroup.code COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
    ]);

    const [groups, coverage] = await Promise.all([
      builder.getMany(),
      this.dataSource.query<Array<{ ungroupedShare: number | string | null }>>(
        'SELECT [ungrouped_share] AS [ungroupedShare] FROM [dbo].[item_group_coverage]',
      ),
    ]);
    const share = coverage[0]?.ungroupedShare;

    return {
      items: groups.map((group) => ({ code: group.code, itemCount: group.itemCount })),
      ungroupedSalesShare: share === null || share === undefined ? null : Number(share),
    };
  }
}
