import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { EmployeeSalaryEntity } from '../employee-salaries/entities/employee-salary.entity.js';
import { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { ErpEmployeeEntity } from '../erp-employees/entities/erp-employee.entity.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { KpiResultEntity } from '../kpi-results/entities/kpi-result.entity.js';
import { KpiTemplateItemEntity } from '../kpi-templates/entities/kpi-template-item.entity.js';
import { KpiTemplateEntity } from '../kpi-templates/entities/kpi-template.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiAssignmentItemEntity } from './entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from './entities/kpi-assignment.entity.js';
import { KpiAssignmentsController } from './kpi-assignments.controller.js';
import { KpiAssignmentsService } from './kpi-assignments.service.js';
import { KpiRecommendationsService } from './kpi-recommendations.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KpiAssignmentEntity,
      KpiAssignmentItemEntity,
      KpiPeriodEntity,
      KpiResultEntity,
      KpiTemplateEntity,
      KpiTemplateItemEntity,
      EmployeeEntity,
      EmployeeSalaryEntity,
      ErpEmployeeEntity,
      StoreEntity,
    ]),
    AuthModule,
  ],
  controllers: [KpiAssignmentsController],
  providers: [KpiAssignmentsService, KpiRecommendationsService],
})
export class KpiAssignmentsModule {}
