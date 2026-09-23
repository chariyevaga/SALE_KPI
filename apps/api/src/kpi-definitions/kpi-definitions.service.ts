import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SEARCH_COLLATION, andWhereEachSearchTerm } from '../common/sql-search.js';
import type { ListKpiDefinitionsQueryDto } from './dto/list-kpi-definitions-query.dto.js';
import { KpiDefinitionEntity } from './entities/kpi-definition.entity.js';
import { type KpiDefinitionResponse, toKpiDefinitionResponse } from './kpi-definition-response.js';

@Injectable()
export class KpiDefinitionsService {
  constructor(
    @InjectRepository(KpiDefinitionEntity)
    private readonly repository: Repository<KpiDefinitionEntity>,
  ) {}

  async list(query: ListKpiDefinitionsQueryDto = {}): Promise<KpiDefinitionResponse[]> {
    const builder = this.repository
      .createQueryBuilder('definition')
      .where('definition.isActive = :isActive', { isActive: true })
      .orderBy('definition.sortOrder', 'ASC')
      .addOrderBy('definition.code', 'ASC');

    // OPENJSON exposes only the translated values, so JSON keys such as "tr" never match.
    andWhereEachSearchTerm(builder, query.search, [
      (parameter) => `definition.code COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
      (parameter) =>
        `EXISTS (SELECT 1 FROM OPENJSON(definition.name) AS translation WHERE translation.[value] COLLATE ${SEARCH_COLLATION} LIKE :${parameter})`,
    ]);

    const definitions = await builder.getMany();

    return definitions.map(toKpiDefinitionResponse);
  }
}
