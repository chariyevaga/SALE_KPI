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
  Query,
  Req,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { SalaryMonthQueryDto } from './dto/salary-month-query.dto.js';
import { SaveEmployeeSalaryDto } from './dto/save-employee-salary.dto.js';
import { EmployeeSalaryErrorResponse } from './employee-salary-errors.js';
import {
  EmployeeSalaryInForceResponse,
  EmployeeSalaryListResponse,
  EmployeeSalaryResponse,
} from './employee-salary-response.js';
import { EmployeeSalariesService } from './employee-salaries.service.js';

const FORBIDDEN =
  '`full_access` yok. Maaşları yalnız full_access kullanıcılar görür ve değiştirir.';
const PERCENT_TOTAL =
  '`EMPLOYEE_SALARY_PERCENT_TOTAL`: sabit ve KPI yüzdelerinin toplamı 100 değil.';
const MONTH_EXISTS =
  '`EMPLOYEE_SALARY_MONTH_EXISTS`: çalışanın o ay için zaten bir maaşı var. `EMPLOYEE_SALARY_PERIOD_CLOSED`: değişiklik, çalışanın planı olan kapanmış bir ayın maaşını değiştirir (`months`); önce dönem yeniden açılır.';

@ApiTags('employee-salaries')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(AccessTokenGuard)
export class EmployeeSalariesController {
  constructor(
    @Inject(EmployeeSalariesService) private readonly salariesService: EmployeeSalariesService,
  ) {}

  // Declared before the ':employeeId' routes of the same prefix so "me" is never a GUID.
  @Get('employee-salaries/me/in-force')
  @ApiOperation({
    summary: 'Oturum sahibinin o ay geçerli maaşı (herkes, yalnız kendisininki).',
    description:
      '"KPI’larım" ekranı maaşın KPI kısmının ne kadar ettiğini göstermek için okur. Çalışan yalnız kendi maaşını görür; başka birinin maaşı yalnız `full_access` ile `GET /employees/:employeeId/salaries/in-force` üzerinden okunur. Yazma yine yalnız `full_access` (ADR-048).',
  })
  @ApiQuery({ name: 'month', required: false, type: String, example: '2026-09' })
  @ApiOkResponse({ type: EmployeeSalaryInForceResponse })
  mine(
    @Req() request: AuthenticatedRequest,
    @Query() query: SalaryMonthQueryDto,
  ): Promise<EmployeeSalaryInForceResponse> {
    return this.salariesService.inForce(request.employee.id, query.month);
  }

  @Get('employees/:employeeId/salaries/in-force')
  @UseGuards(FullAccessGuard)
  @ApiOperation({ summary: 'Bir çalışanın o ay geçerli maaşı (yalnız full_access).' })
  @ApiParam({ name: 'employeeId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'month', required: false, type: String, example: '2026-09' })
  @ApiOkResponse({ type: EmployeeSalaryInForceResponse })
  @ApiForbiddenResponse({ description: FORBIDDEN })
  inForce(
    @Param('employeeId', new ParseUUIDPipe()) employeeId: string,
    @Query() query: SalaryMonthQueryDto,
  ): Promise<EmployeeSalaryInForceResponse> {
    return this.salariesService.inForce(employeeId, query.month);
  }

  @Get('employees/:employeeId/salaries')
  @UseGuards(FullAccessGuard)
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
  @UseGuards(FullAccessGuard)
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
  @UseGuards(FullAccessGuard)
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
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Bir maaş kaydını siler (yalnız full_access).',
    description: 'Silinen kaydın ayından sonra bir önceki maaş geçerli olur.',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiNoContentResponse({ description: 'Silindi.' })
  @ApiConflictResponse({ type: EmployeeSalaryErrorResponse, description: MONTH_EXISTS })
  @ApiNotFoundResponse({ description: 'Maaş kaydı yok.' })
  @ApiForbiddenResponse({ description: FORBIDDEN })
  remove(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    return this.salariesService.remove(id);
  }
}
