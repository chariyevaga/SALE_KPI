import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiResultEntity } from '../kpi-results/entities/kpi-result.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiPeriodEntity } from './entities/kpi-period.entity.js';
import { KpiPeriodExportService } from './kpi-period-export.service.js';
import { KpiPeriodsController } from './kpi-periods.controller.js';
import { KpiPeriodsService } from './kpi-periods.service.js';

@Module({
  // Plans, results, salaries, ERP codes and stores are only read here: for a period's plan
  // counts and for its Excel file (ADR-059).
  imports: [
    TypeOrmModule.forFeature([
      KpiPeriodEntity,
      KpiAssignmentEntity,
      KpiAssignmentItemEntity,
      KpiResultEntity,
      EmployeeSalaryEntity,
      ErpEmployeeEntity,
      StoreEntity,
    ]),
    AuthModule,
  ],
  controllers: [KpiPeriodsController],
  providers: [KpiPeriodsService, KpiPeriodExportService],
})
export class KpiPeriodsModule {}
