import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { SaveEmployeeSalaryDto } from './dto/save-employee-salary.dto.js';
import { EmployeeSalaryErrorResponse } from './employee-salary-errors.js';
import { EmployeeSalaryListResponse, EmployeeSalaryResponse } from './employee-salary-response.js';
import { EmployeeSalariesService } from './employee-salaries.service.js';

const FORBIDDEN =
  '`full_access` yok. Maaşları yalnız full_access kullanıcılar görür ve değiştirir.';
const PERCENT_TOTAL =
  '`EMPLOYEE_SALARY_PERCENT_TOTAL`: sabit ve KPI yüzdelerinin toplamı 100 değil.';
const MONTH_EXISTS = '`EMPLOYEE_SALARY_MONTH_EXISTS`: çalışanın o ay için zaten bir maaşı var.';

@ApiTags('employee-salaries')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(AccessTokenGuard, FullAccessGuard)
export class EmployeeSalariesController {
  constructor(
    @Inject(EmployeeSalariesService) private readonly salariesService: EmployeeSalariesService,
  ) {}

  @Get('employees/:employeeId/salaries')
  @ApiOperation({
    summary: 'Çalışanın maaşlarını ve bu ay geçerli olanı döner (yalnız full_access).',
    description:
      'Maaş döneme bağlı değildir; geçerli olduğu ilk ayla girilir. Bir ayın maaşı, ayı o aydan sonra olmayan en yeni kayıttır (ADR-048). Liste sayfasızdır: bir kişinin maaş geçmişi birkaç satırdır.',
  })
  @ApiParam({ name: 'employeeId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: EmployeeSalaryListResponse })
  @ApiNotFoundResponse({ description: 'Çalışan yok.' })
  @ApiForbiddenResponse({ description: FORBIDDEN })
  list(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
  ): Promise<EmployeeSalaryListResponse> {
    return this.salariesService.list(employeeId);
  }

  @Post('employees/:employeeId/salaries')
  @ApiOperation({ summary: 'Çalışana bir aydan itibaren geçerli maaş ekler (yalnız full_access).' })
  @ApiParam({ name: 'employeeId', type: String, format: 'uuid' })
  @ApiBody({ type: SaveEmployeeSalaryDto })
  @ApiCreatedResponse({ type: EmployeeSalaryResponse })
  @ApiBadRequestResponse({ type: EmployeeSalaryErrorResponse, description: PERCENT_TOTAL })
  @ApiConflictResponse({ type: EmployeeSalaryErrorResponse, description: MONTH_EXISTS })
  @ApiNotFoundResponse({ description: 'Çalışan yok.' })
  @ApiForbiddenResponse({ description: FORBIDDEN })
  create(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Body() dto: SaveEmployeeSalaryDto,
  ): Promise<EmployeeSalaryResponse> {
    return this.salariesService.create(employeeId, dto);
  }

  @Put('employee-salaries/:id')
  @ApiOperation({ summary: 'Bir maaş kaydını düzeltir (yalnız full_access).' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({ type: SaveEmployeeSalaryDto })
  @ApiOkResponse({ type: EmployeeSalaryResponse })
  @ApiBadRequestResponse({ type: EmployeeSalaryErrorResponse, description: PERCENT_TOTAL })
  @ApiConflictResponse({ type: EmployeeSalaryErrorResponse, description: MONTH_EXISTS })
  @ApiNotFoundResponse({ description: 'Maaş kaydı yok.' })
  @ApiForbiddenResponse({ description: FORBIDDEN })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SaveEmployeeSalaryDto,
  ): Promise<EmployeeSalaryResponse> {
    return this.salariesService.update(id, dto);
  }

  @Delete('employee-salaries/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Bir maaş kaydını siler (yalnız full_access).',
    description: 'Silinen kaydın ayından sonra bir önceki maaş geçerli olur.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Silindi.' })
  @ApiNotFoundResponse({ description: 'Maaş kaydı yok.' })
  @ApiForbiddenResponse({ description: FORBIDDEN })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.salariesService.remove(id);
  }
}
