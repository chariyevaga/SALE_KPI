import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TIGER, getTigerDataSourceOptions } from './tiger-data-source.options.js';
import { TigerTables } from './tiger-tables.js';

/**
 * Read-only Logo Tiger access for KPI calculations (ADR-037): the `tiger` data source and
 * the table names of the configured firm and period. KPI readers arrive in step 2.
 */
@Global()
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      name: TIGER,
      // The name is needed in the factory result too: shutdown looks the data source up by it.
      useFactory: () => ({ ...getTigerDataSourceOptions(), name: TIGER }),
    }),
  ],
  providers: [{ provide: TigerTables, useFactory: () => TigerTables.fromEnvironment() }],
  exports: [TigerTables],
})
export class TigerModule {}
