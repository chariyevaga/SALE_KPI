import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { ItemGroupEntity } from './entities/item-group.entity.js';
import { ItemGroupsController } from './item-groups.controller.js';
import { ItemGroupsService } from './item-groups.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([ItemGroupEntity]), AuthModule],
  controllers: [ItemGroupsController],
  providers: [ItemGroupsService],
})
export class ItemGroupsModule {}
