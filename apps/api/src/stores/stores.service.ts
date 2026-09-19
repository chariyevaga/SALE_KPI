import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SEARCH_COLLATION, andWhereEachSearchTerm } from '../common/sql-search.js';
import { getFirmNumber } from '../config/environment.js';
import type { ListStoresQueryDto } from './dto/list-stores-query.dto.js';
import { StoreEntity } from './entities/store.entity.js';
import type { StoreOptionResponse } from './store-response.js';

@Injectable()
export class StoresService {
  constructor(
    @InjectRepository(StoreEntity)
    private readonly repository: Repository<StoreEntity>,
  ) {}

  async list(query: ListStoresQueryDto = {}): Promise<StoreOptionResponse[]> {
    const builder = this.repository
      .createQueryBuilder('store')
      .select(['store.id', 'store.nr', 'store.name'])
      .where('store.firmNr = :firmNr', { firmNr: getFirmNumber() })
      .orderBy('store.nr', 'ASC');

    // Tiger columns are varchar (Turkish_CI_AS); cast before collating (see SEARCH_COLLATION).
    andWhereEachSearchTerm(builder, query.search, [
      (parameter) => `CAST(store.nr AS nvarchar(12)) LIKE :${parameter}`,
      (parameter) =>
        `CAST(store.name AS nvarchar(255)) COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
    ]);

    const stores = await builder.getMany();

    return stores.map((store) => ({
      id: store.id,
      name: store.name,
      nr: store.nr,
    }));
  }
}
