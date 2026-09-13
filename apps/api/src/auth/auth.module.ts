import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DeviceSessionEntity } from '../device-sessions/entities/device-session.entity.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { AccessTokenGuard } from './access-token.guard.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { FullAccessGuard } from './full-access.guard.js';
import { PasswordService } from './password.service.js';
import { TokenService } from './token.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEntity, DeviceSessionEntity])],
  controllers: [AuthController],
  providers: [
    AccessTokenGuard,
    AuthService,
    FullAccessGuard,
    PasswordService,
    TokenService,
  ],
  exports: [AccessTokenGuard, AuthService, FullAccessGuard, PasswordService, TokenService],
})
export class AuthModule {}
