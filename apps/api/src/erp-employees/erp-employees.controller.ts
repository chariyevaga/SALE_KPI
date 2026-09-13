import { Controller, Get, Inject, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { ErpEmployeeOptionResponse } from './erp-employee-response.js';
import { ErpEmployeesService } from './erp-employees.service.js';

@ApiTags('erp-employees')
@ApiBearerAuth('access-token')
@Controller('erp-employees')
@UseGuards(AccessTokenGuard, FullAccessGuard)
export class ErpEmployeesController {
  constructor(
    @Inject(ErpEmployeesService) private readonly erpEmployeesService: ErpEmployeesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: '.env FIRM_NR değerine göre filtrelenmiş, aktif Logo Tiger satış personelini listeler.',
    description: 'Employee formundaki ERP satış personeli seçim listesi için kullanılır.',
  })
  @ApiOkResponse({ type: ErpEmployeeOptionResponse, isArray: true })
  list(): Promise<ErpEmployeeOptionResponse[]> {
    return this.erpEmployeesService.list();
  }
}
