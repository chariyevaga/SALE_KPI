import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module.js';
import { getKpiDataSourceOptions } from './database/kpi-data-source.options.js';
import { EmployeesModule } from './employees/employees.module.js';
import { ErpEmployeesModule } from './erp-employees/erp-employees.module.js';
import { FilesModule } from './files/files.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(getKpiDataSourceOptions()),
    ScheduleModule.forRoot(),
    HealthModule,
    AuthModule,
    FilesModule,
    EmployeesModule,
    ErpEmployeesModule,
  ],
})
export class AppModule {}
