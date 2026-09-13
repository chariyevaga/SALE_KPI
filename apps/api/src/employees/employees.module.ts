import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { FilesModule } from '../files/files.module.js';
import { EmployeeAvatarFileReferenceHandler } from './employee-avatar-file-reference.handler.js';
import { EmployeesController } from './employees.controller.js';
import { EmployeesService } from './employees.service.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { EmployeeEntity } from './entities/employee.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([EmployeeEntity, ErpEmployeeEntity]), AuthModule, FilesModule],
  controllers: [EmployeesController],
  providers: [EmployeeAvatarFileReferenceHandler, EmployeesService],
  exports: [TypeOrmModule],
})
export class EmployeesModule {}
