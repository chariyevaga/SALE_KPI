import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SEARCH_COLLATION, andWhereEachSearchTerm } from '../common/sql-search.js';
import { getFirmNumber } from '../config/environment.js';
import type { ListErpEmployeesQueryDto } from './dto/list-erp-employees-query.dto.js';
import type { ErpEmployeeOptionResponse } from './erp-employee-response.js';
import { ErpEmployeeEntity } from './entities/erp-employee.entity.js';

@Injectable()
export class ErpEmployeesService {
  constructor(
    @InjectRepository(ErpEmployeeEntity)
    private readonly repository: Repository<ErpEmployeeEntity>,
  ) {}

  async list(query: ListErpEmployeesQueryDto = {}): Promise<ErpEmployeeOptionResponse[]> {
    const builder = this.repository
      .createQueryBuilder('erpEmployee')
      .select(['erpEmployee.id', 'erpEmployee.code', 'erpEmployee.name'])
      .where('erpEmployee.firmNr = :firmNr', { firmNr: getFirmNumber() })
      .andWhere('erpEmployee.isActive = :isActive', { isActive: true })
      .orderBy('erpEmployee.name', 'ASC');

    // Tiger columns are varchar (Turkish_CI_AS); cast before collating (see SEARCH_COLLATION).
    andWhereEachSearchTerm(builder, query.search, [
      (parameter) =>
        `CAST(erpEmployee.code AS nvarchar(255)) COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
      (parameter) =>
        `CAST(erpEmployee.name AS nvarchar(255)) COLLATE ${SEARCH_COLLATION} LIKE :${parameter}`,
    ]);

    const employees = await builder.getMany();

    return employees.map((employee) => ({
      code: employee.code,
      id: employee.id,
      name: employee.name,
    }));
  }
}
