import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { EmployeeSalaryEntity } from './entities/employee-salary.entity.js';
import { EmployeeSalariesController } from './employee-salaries.controller.js';
import { EmployeeSalariesService } from './employee-salaries.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeSalaryEntity, EmployeeEntity, KpiAssignmentEntity]),
    AuthModule,
  ],
  controllers: [EmployeeSalariesController],
  providers: [EmployeeSalariesService],
})
export class EmployeeSalariesModule {}
