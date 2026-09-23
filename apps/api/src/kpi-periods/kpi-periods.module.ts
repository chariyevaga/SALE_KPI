import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiPeriodEntity } from './entities/kpi-period.entity.js';
import { KpiPeriodsController } from './kpi-periods.controller.js';
import { KpiPeriodsService } from './kpi-periods.service.js';

@Module({
  // Assignments are only read here, for the plan counts of a period.
  imports: [TypeOrmModule.forFeature([KpiPeriodEntity, KpiAssignmentEntity]), AuthModule],
  controllers: [KpiPeriodsController],
  providers: [KpiPeriodsService],
})
export class KpiPeriodsModule {}
