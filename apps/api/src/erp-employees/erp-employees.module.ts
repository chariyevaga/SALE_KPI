import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { ErpEmployeeEntity } from './entities/erp-employee.entity.js';
import { ErpEmployeesController } from './erp-employees.controller.js';
import { ErpEmployeesService } from './erp-employees.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ErpEmployeeEntity]), AuthModule],
  controllers: [ErpEmployeesController],
  providers: [ErpEmployeesService],
})
export class ErpEmployeesModule {}
