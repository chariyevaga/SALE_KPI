import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { StoreVisitorCountEntity } from './entities/store-visitor-count.entity.js';
import { StoreVisitorCountsController } from './store-visitor-counts.controller.js';
import { StoreVisitorCountsService } from './store-visitor-counts.service.js';
import { VisitorCountAccessGuard } from './visitor-count.guards.js';

@Module({
  // Stores and periods are only read here: the store must exist, a closed month is frozen.
  imports: [
    TypeOrmModule.forFeature([StoreVisitorCountEntity, StoreEntity, KpiPeriodEntity]),
    AuthModule,
  ],
  controllers: [StoreVisitorCountsController],
  providers: [StoreVisitorCountsService, VisitorCountAccessGuard],
})
export class StoreVisitorCountsModule {}
