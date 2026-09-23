import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { KpiResultsModule } from '../kpi-results/kpi-results.module.js';
import { LeaderboardController } from './leaderboard.controller.js';
import { LeaderboardService } from './leaderboard.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([KpiPeriodEntity, KpiAssignmentEntity, KpiAssignmentItemEntity]),
    AuthModule,
    KpiResultsModule,
  ],
  controllers: [LeaderboardController],
  providers: [LeaderboardService],
})
export class LeaderboardModule {}
