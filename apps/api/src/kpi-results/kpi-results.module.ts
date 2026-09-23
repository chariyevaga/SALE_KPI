import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiResultEntity } from './entities/kpi-result.entity.js';
import { KpiAutoCalculationService } from './kpi-auto-calculation.service.js';
import { KpiResultsController } from './kpi-results.controller.js';
import { KpiResultsService } from './kpi-results.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KpiResultEntity,
      KpiAssignmentEntity,
      KpiAssignmentItemEntity,
      KpiPeriodEntity,
      StoreEntity,
    ]),
    AuthModule,
  ],
  controllers: [KpiResultsController],
  providers: [KpiResultsService, KpiAutoCalculationService],
  exports: [KpiAutoCalculationService],
})
export class KpiResultsModule {}
