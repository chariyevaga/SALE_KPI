import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getFirmNumber } from '../config/environment.js';
import type { ErpEmployeeOptionResponse } from './erp-employee-response.js';
import { ErpEmployeeEntity } from './entities/erp-employee.entity.js';

@Injectable()
export class ErpEmployeesService {
  constructor(
    @InjectRepository(ErpEmployeeEntity)
    private readonly repository: Repository<ErpEmployeeEntity>,
  ) {}

  async list(): Promise<ErpEmployeeOptionResponse[]> {
    const employees = await this.repository.find({
      where: { firmNr: getFirmNumber(), isActive: true },
      order: { name: 'ASC' },
    });

    return employees.map((employee) => ({
      code: employee.code,
      id: employee.id,
      name: employee.name,
    }));
  }
}
