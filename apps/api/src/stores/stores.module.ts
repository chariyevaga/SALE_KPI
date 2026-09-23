import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from '../auth/auth.module.js';
import { StoreEntity } from './entities/store.entity.js';
import { StoresController } from './stores.controller.js';
import { StoresService } from './stores.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([StoreEntity]), AuthModule],
  controllers: [StoresController],
  providers: [StoresService],
})
export class StoresModule {}
