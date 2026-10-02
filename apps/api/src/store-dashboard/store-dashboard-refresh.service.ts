import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { Between, DataSource, In } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import {
  getBusinessTimeZone,
  getFirmNumber,
  getStoreDashboardRefreshIntervalMinutes,
} from '../config/environment.js';
import { dateInZone } from '../kpi-results/conversion-rules.js';
import { StoreKpiMonthValueEntity } from './entities/store-kpi-month-value.entity.js';
import {
  STORE_DASHBOARD_KPI_CODES,
  planRefresh,
  refreshWindow,
  type StoreMonthValue,
} from './store-dashboard-rules.js';

export const STORE_DASHBOARD_REFRESH_JOB = 'store-dashboard-refresh';

/** SQL Server accepts at most 2,100 parameters per statement. */
const MAX_IDS_PER_STATEMENT = 1_000;

/** What the dashboard may say about the job, e.g. "updated 12 minutes ago, hourly". */
export interface StoreDashboardRefreshStatus {
  /** 0 when the job is switched off. */
  intervalMinutes: number;
  /** End of the last finished run since the API started; null before the first one. */
  lastRunAt: Date | null;
}

interface RefreshResult {
  months: number;
  inserted: number;
  updated: number;
  deleted: number;
}

/**
 * Keeps `store_kpi_month_values` current (ADR-061), so the store dashboard reads stored values
 * and never computes from Tiger per request (ADR-010). Each run reads January of last year
 * through the current month from `dbo.kpi_month_values` in one query; older years keep the
 * values they were last refreshed with.
 *
 * - Runs once when the API starts, then every `STORE_DASHBOARD_REFRESH_INTERVAL_MINUTES`
 *   (default 60, 0 = off).
 * - A run never overlaps the previous one; a tick that finds a run in progress is dropped.
 * - The rows are derived data written by the system on every run, like refresh token
 *   rotation: they are stamped (NULL actor) but not logged one by one (ADR-036, ADR-061).
 * - Like the other scheduled jobs, it assumes a single API replica (ADR-014).
 */
@Injectable()
export class StoreDashboardRefreshService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(StoreDashboardRefreshService.name);
  private readonly intervalMinutes = getStoreDashboardRefreshIntervalMinutes();
  private running = false;
  private lastRunAt: Date | null = null;

  constructor(
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(SchedulerRegistry) private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    if (this.intervalMinutes === 0) {
      this.logger.log(
        'Store dashboard refresh is off (STORE_DASHBOARD_REFRESH_INTERVAL_MINUTES=0).',
      );
      return;
    }

    const handle = setInterval(() => {
      void this.runOnce();
    }, this.intervalMinutes * 60_000);

    this.schedulerRegistry.addInterval(STORE_DASHBOARD_REFRESH_JOB, handle);
    this.logger.log(`Store dashboard values are refreshed every ${this.intervalMinutes} minutes.`);
    // The first run does not wait an interval: after a deploy the dashboard fills at once.
    void this.runOnce();
  }

  onApplicationShutdown(): void {
    if (this.schedulerRegistry.doesExist('interval', STORE_DASHBOARD_REFRESH_JOB)) {
      this.schedulerRegistry.deleteInterval(STORE_DASHBOARD_REFRESH_JOB);
    }
  }

  status(): StoreDashboardRefreshStatus {
    return { intervalMinutes: this.intervalMinutes, lastRunAt: this.lastRunAt };
  }

  /** One refresh; returns false when a refresh was already running. */
  async runOnce(now: Date = new Date()): Promise<boolean> {
    if (this.running) {
      this.logger.warn('Previous store dashboard refresh is still running; this tick is skipped.');
      return false;
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      const window = refreshWindow(dateInZone(now, getBusinessTimeZone()));
      const result = await this.refresh(window.from, window.to);

      this.lastRunAt = new Date();
      this.logger.log(
        `Store dashboard refresh: ${result.months} months, ${result.inserted} added, ${result.updated} changed, ${result.deleted} removed, ${Date.now() - startedAt} ms.`,
      );
      return true;
    } catch (error: unknown) {
      this.logger.error(
        `Store dashboard refresh failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      return true;
    } finally {
      this.running = false;
    }
  }

  private async refresh(from: string, to: string): Promise<RefreshResult> {
    const fresh = await this.readMonthValues(from, to);
    const firmNr = getFirmNumber();

    return this.dataSource.transaction(async (manager) => {
      const stored = await manager.find(StoreKpiMonthValueEntity, {
        where: { firmNr, monthStart: Between(from, to) },
      });
      const plan = planRefresh(stored, fresh);

      for (let index = 0; index < plan.deleteIds.length; index += MAX_IDS_PER_STATEMENT) {
        await this.audit.delete(
          manager,
          StoreKpiMonthValueEntity,
          { id: In(plan.deleteIds.slice(index, index + MAX_IDS_PER_STATEMENT)) },
          { log: false },
        );
      }

      await this.audit.insertMany(
        manager,
        StoreKpiMonthValueEntity,
        plan.inserts.map((row) => ({ ...row, firmNr })),
        { log: false },
      );

      for (const { id, value } of plan.updates) {
        await this.audit.update(
          manager,
          StoreKpiMonthValueEntity,
          { id },
          { value },
          { log: false },
        );
      }

      return {
        months: new Set(fresh.map((row) => row.monthStart)).size,
        inserted: plan.inserts.length,
        updated: plan.updates.length,
        deleted: plan.deleteIds.length,
      };
    });
  }

  /**
   * Every store's values of the dashboard KPIs for each month from `from` to `to`, from the
   * single implementation of the measures (`dbo.kpi_month_values`, ADR-041), in one query.
   */
  private async readMonthValues(from: string, to: string): Promise<StoreMonthValue[]> {
    const codes = STORE_DASHBOARD_KPI_CODES.map((_, index) => `@${String(index + 2)}`);
    const rows = await this.dataSource.query<
      {
        monthStart: string;
        storeNr: number;
        kpiCode: string;
        currency: string | null;
        value: number | string;
      }[]
    >(
      `
        WITH [months] AS (
          SELECT CAST(@0 AS date) AS [month_start]
          UNION ALL
          SELECT DATEADD(month, 1, [month_start])
          FROM [months]
          WHERE [month_start] < CAST(@1 AS date)
        )
        SELECT
          CONVERT(char(10), m.[month_start], 23) AS [monthStart],
          v.[entity_ref] AS [storeNr],
          v.[kpi_code] AS [kpiCode],
          v.[currency] AS [currency],
          v.[value] AS [value]
        FROM [months] m
        CROSS APPLY [dbo].[kpi_month_values](m.[month_start]) v
        WHERE v.[kpi_code] IN (${codes.join(', ')})
        OPTION (MAXRECURSION 100)
      `,
      [from, to, ...STORE_DASHBOARD_KPI_CODES],
    );

    return rows.map((row) => ({
      monthStart: row.monthStart,
      storeNr: row.storeNr,
      kpiCode: row.kpiCode,
      currency: row.currency,
      value: Number(row.value),
    }));
  }
}
