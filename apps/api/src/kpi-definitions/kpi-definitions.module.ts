import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiDefinitionEntity } from './entities/kpi-definition.entity.js';
import { KpiDefinitionsController } from './kpi-definitions.controller.js';
import { KpiDefinitionsService } from './kpi-definitions.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([KpiDefinitionEntity]), AuthModule],
  controllers: [KpiDefinitionsController],
  providers: [KpiDefinitionsService],
})
export class KpiDefinitionsModule {}
