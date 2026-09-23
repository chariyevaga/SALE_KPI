import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { AuditLogsController } from './audit-logs.controller.js';
import { AuditLogsService } from './audit-logs.service.js';
import { AuditLogEntity } from './entities/audit-log.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLogEntity, EmployeeEntity]), AuthModule],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}
