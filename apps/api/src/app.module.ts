import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuditLogsModule } from './audit/audit-logs.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { RequestContextMiddleware } from './common/request-context.middleware.js';
import { getKpiDataSourceOptions } from './database/kpi-data-source.options.js';
import { EmployeesModule } from './employees/employees.module.js';
import { ErpEmployeesModule } from './erp-employees/erp-employees.module.js';
import { FilesModule } from './files/files.module.js';
import { HealthModule } from './health/health.module.js';
import { KpiAssignmentsModule } from './kpi-assignments/kpi-assignments.module.js';
import { KpiDefinitionsModule } from './kpi-definitions/kpi-definitions.module.js';
import { KpiPeriodsModule } from './kpi-periods/kpi-periods.module.js';
import { KpiTemplatesModule } from './kpi-templates/kpi-templates.module.js';
import { StoresModule } from './stores/stores.module.js';
import { TigerModule } from './tiger/tiger.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(getKpiDataSourceOptions()),
    ScheduleModule.forRoot(),
    AuditModule,
    TigerModule,
    HealthModule,
    AuthModule,
    FilesModule,
    EmployeesModule,
    ErpEmployeesModule,
    StoresModule,
    KpiDefinitionsModule,
    KpiTemplatesModule,
    KpiPeriodsModule,
    KpiAssignmentsModule,
    AuditLogsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}
