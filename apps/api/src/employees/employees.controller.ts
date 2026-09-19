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
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { AuthService } from '../auth/auth.service.js';
import { DeviceSessionResponse, type AuthenticatedRequest } from '../auth/auth.types.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { BulkStatusDto, BulkUpdateResponse } from '../common/dto/bulk.dto.js';
import { CreateEmployeeDto } from './dto/create-employee.dto.js';
import { ListEmployeesQueryDto } from './dto/list-employees-query.dto.js';
import { UpdateEmployeeDto } from './dto/update-employee.dto.js';
import { UpdateOwnProfileDto } from './dto/update-own-profile.dto.js';
import { EmployeeListResponse } from './employee-list-response.js';
import { EmployeeResponse } from './employee-response.js';
import { EmployeesService } from './employees.service.js';

@ApiTags('employees')
@ApiBearerAuth('access-token')
@Controller('employees')
@UseGuards(AccessTokenGuard)
export class EmployeesController {
  constructor(
    @Inject(EmployeesService) private readonly employeesService: EmployeesService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}

  @Get()
  @UseGuards(FullAccessGuard)
  @ApiOperation({
    summary: 'Çalışanları sayfalanmış olarak isme göre listeler.',
    description: 'Sonsuz kaydırma (infinite scroll) için page/limit destekler; varsayılan limit 20, azami 100.',
  })
  @ApiOkResponse({ type: EmployeeListResponse })
  list(
    @Query() query: ListEmployeesQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<EmployeeListResponse> {
    return this.employeesService.list(query, request.employee);
  }

  @Get(':id')
  @UseGuards(FullAccessGuard)
  @ApiOperation({ summary: 'Tek bir çalışanı kimliğine göre getirir.' })
  @ApiOkResponse({ type: EmployeeResponse })
  get(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Req() request: AuthenticatedRequest,
  ): Promise<EmployeeResponse> {
    return this.employeesService.get(id, request.employee);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Oturum sahibinin kendi profilini günceller (şu an yalnızca avatar).',
    description: 'Yönetici yetkisi gerektirmez; çalışan yalnızca kendi kaydını değiştirebilir.',
  })
  @ApiOkResponse({ type: EmployeeResponse })
  updateOwnProfile(
    @Req() request: AuthenticatedRequest,
    @Body() dto: UpdateOwnProfileDto,
  ): Promise<EmployeeResponse> {
    return this.employeesService.updateOwnProfile(request.employee.id, dto);
  }

  @Get(':id/sessions')
  @UseGuards(FullAccessGuard)
  @ApiOperation({ summary: 'Bir çalışanın aktif cihaz oturumlarını listeler.' })
  @ApiOkResponse({ type: DeviceSessionResponse, isArray: true })
  listSessions(
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<DeviceSessionResponse[]> {
    return this.authService.listActiveDevices(id);
  }

  @Delete(':id/sessions/:sessionId')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bir çalışanın belirtilen cihaz oturumunu iptal eder.' })
  @ApiNoContentResponse()
  async revokeSession(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Param('sessionId', new ParseUUIDPipe()) sessionId: string,
  ): Promise<void> {
    await this.authService.revokeDevice(id, sessionId);
  }

  @Post(':id/sessions/revoke-all')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bir çalışanın tüm cihaz oturumlarını iptal eder.' })
  @ApiNoContentResponse()
  async revokeAllSessions(@Param('id', new ParseUUIDPipe()) id: string): Promise<void> {
    await this.authService.logoutAll(id);
  }

  @Post()
  @UseGuards(FullAccessGuard)
  @ApiOperation({ summary: 'Yeni bir çalışan/giriş hesabı oluşturur.' })
  @ApiOkResponse({ type: EmployeeResponse })
  create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponse> {
    return this.employeesService.create(dto);
  }

  @Patch(':id')
  @UseGuards(FullAccessGuard)
  @ApiOperation({ summary: 'Bir çalışanın alanlarını kısmi olarak günceller.' })
  @ApiOkResponse({ type: EmployeeResponse })
  update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponse> {
    return this.employeesService.update(id, dto);
  }

  @Post('bulk-status')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Seçilen çalışanları toplu olarak aktifleştirir veya pasifleştirir (yalnız full_access).',
    description:
      'Tek transaction içinde çalışır. Pasifleştirmede, tekil `DELETE /employees/:id` gibi çalışanların açık cihaz oturumları `employee_deactivated` nedeniyle iptal edilir. Pasifleştirilecekler arasında kendi hesabınız varsa hiçbir kayıt değişmez ve 409 döner. Yalnız durumu gerçekten değişen kayıtlar sayılır.',
  })
  @ApiBody({ type: BulkStatusDto })
  @ApiOkResponse({ type: BulkUpdateResponse })
  @ApiConflictResponse({ description: 'Pasifleştirilecekler arasında kendi hesabınız var.' })
  setActiveMany(
    @Req() request: AuthenticatedRequest,
    @Body() dto: BulkStatusDto,
  ): Promise<BulkUpdateResponse> {
    return this.employeesService.setActiveMany(dto.ids, dto.isActive, request.employee.id);
  }

  @Delete(':id')
  @UseGuards(FullAccessGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Çalışanı devre dışı bırakır (soft delete) ve tüm aktif cihaz oturumlarını iptal eder.',
    description: 'Kalıcı silme yapılmaz; is_active alanı false olur. Kendi hesabınızı devre dışı bırakamazsınız.',
  })
  @ApiNoContentResponse()
  async remove(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.employeesService.deactivate(id, request.employee.id);
  }
}
