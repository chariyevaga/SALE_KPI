import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Ip,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { EmployeeResponse, toEmployeeResponse } from '../employees/employee-response.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthService } from './auth.service.js';
import { AuthResponse, DeviceSessionResponse, type AuthenticatedRequest } from './auth.types.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Kullanıcı adı, parola ve cihaz kimliğiyle giriş yapar.' })
  @ApiOkResponse({ type: AuthResponse })
  login(
    @Body() dto: LoginDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent: string | undefined,
  ): Promise<AuthResponse> {
    return this.authService.login(dto, {
      ipAddress: ipAddress || null,
      userAgent: userAgent?.slice(0, 1024) ?? null,
    });
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh token rotation ile yeni access/refresh token çifti üretir.',
  })
  @ApiOkResponse({ type: AuthResponse })
  refresh(@Body() dto: RefreshDto): Promise<AuthResponse> {
    return this.authService.refresh(dto);
  }

  @Get('me')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Giriş yapmış çalışanın profilini döner.' })
  @ApiOkResponse({ type: EmployeeResponse })
  me(@Req() request: AuthenticatedRequest): EmployeeResponse {
    return toEmployeeResponse(request.employee);
  }

  @Patch('password')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Çalışanın kendi parolasını değiştirir.',
    description:
      'Mevcut parola doğrulanır; başarılı olursa mevcut oturum dışındaki tüm cihaz oturumları iptal edilir.',
  })
  @ApiNoContentResponse()
  async changePassword(
    @Req() request: AuthenticatedRequest,
    @Body() dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(
      request.employee.id,
      request.accessTokenPayload.sid,
      dto,
    );
  }

  @Post('logout')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Yalnızca mevcut access token\'ın bağlı olduğu cihaz oturumunu iptal eder.' })
  @ApiNoContentResponse()
  async logout(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.logoutCurrent(
      request.employee.id,
      request.accessTokenPayload.sid,
    );
  }

  @Post('logout-all')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Çalışanın tüm aktif cihaz oturumlarını iptal eder.' })
  @ApiNoContentResponse()
  async logoutAll(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.logoutAll(request.employee.id);
  }

  @Get('devices')
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Çalışanın aktif cihaz oturumlarını en son görülene göre listeler.' })
  @ApiOkResponse({ type: DeviceSessionResponse, isArray: true })
  devices(@Req() request: AuthenticatedRequest): Promise<DeviceSessionResponse[]> {
    return this.authService.listActiveDevices(request.employee.id);
  }

  @Delete('devices/:id')
  @UseGuards(AccessTokenGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Belirtilen cihaz oturumunu (device_id değil, GET /auth/devices dönen oturum id\'si) iptal eder.',
  })
  @ApiNoContentResponse()
  async revokeDevice(
    @Req() request: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<void> {
    await this.authService.revokeDevice(request.employee.id, id);
  }
}
