import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { KpiDefinitionEntity } from '../kpi-definitions/entities/kpi-definition.entity.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiTemplateItemEntity } from './entities/kpi-template-item.entity.js';
import { KpiTemplateEntity } from './entities/kpi-template.entity.js';
import { KpiTemplatesController } from './kpi-templates.controller.js';
import { KpiTemplatesService } from './kpi-templates.service.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      KpiTemplateEntity,
      KpiTemplateItemEntity,
      KpiDefinitionEntity,
      StoreEntity,
    ]),
    AuthModule,
  ],
  controllers: [KpiTemplatesController],
  providers: [KpiTemplatesService],
})
export class KpiTemplatesModule {}
