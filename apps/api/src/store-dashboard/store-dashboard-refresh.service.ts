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
import {
  calculateConversion,
  consideredDays,
  dateInZone,
} from '../kpi-results/conversion-rules.js';
import { StoreKpiMonthValueEntity } from './entities/store-kpi-month-value.entity.js';
import {
  STORE_DASHBOARD_CONVERSION_CODE,
  STORE_DASHBOARD_MONTH_VALUE_CODES,
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
 * through the current month from `dbo.kpi_month_values` and `dbo.kpi_month_visitor_values`
 * in one query, and measures the conversion of each store and month with the calculation's
 * rules (ADR-065); older years keep the values they were last refreshed with.
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
      const today = dateInZone(now, getBusinessTimeZone());
      const window = refreshWindow(today);
      const result = await this.refresh(window.from, window.to, today);

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

  private async refresh(from: string, to: string, today: string): Promise<RefreshResult> {
    const firmNr = getFirmNumber();
    const [monthValues, conversions] = await Promise.all([
      this.readMonthValues(from, to),
      this.measureConversions(firmNr, from, today),
    ]);
    const fresh = [...monthValues, ...conversions];

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

      for (const { id, ...values } of plan.updates) {
        await this.audit.update(manager, StoreKpiMonthValueEntity, { id }, values, {
          log: false,
        });
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
   * single implementations of the measures (`dbo.kpi_month_values`, ADR-041, and
   * `dbo.kpi_month_visitor_values`, ADR-064), in one query.
   */
  private async readMonthValues(from: string, to: string): Promise<StoreMonthValue[]> {
    const codes = STORE_DASHBOARD_MONTH_VALUE_CODES.map((_, index) => `@${String(index + 2)}`);
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
        CROSS APPLY (
          SELECT [kpi_code], [entity_ref], [currency], [value]
          FROM [dbo].[kpi_month_values](m.[month_start])
          UNION ALL
          SELECT [kpi_code], [entity_ref], [currency], [value]
          FROM [dbo].[kpi_month_visitor_values](m.[month_start])
        ) v
        WHERE v.[kpi_code] IN (${codes.join(', ')})
        OPTION (MAXRECURSION 100)
      `,
      [from, to, ...STORE_DASHBOARD_MONTH_VALUE_CODES],
    );

    return rows.map((row) => ({
      monthStart: row.monthStart,
      storeNr: row.storeNr,
      kpiCode: row.kpiCode,
      currency: row.currency,
      value: Number(row.value),
      numerator: null,
      denominator: null,
    }));
  }

  /**
   * The conversion (#7) of every store and month from `from` up to yesterday, measured like
   * a plan row of that one store (conversion-rules.ts, ADR-052): only days with an entered
   * visitor count, their sales receipts over their visitors, no value below the coverage
   * rule. Receipts and visitors are kept, so stores and months add up as a rate (ADR-065).
   */
  private async measureConversions(
    firmNr: number,
    from: string,
    today: string,
  ): Promise<StoreMonthValue[]> {
    const counts = await this.dataSource.query<
      { storeId: number; storeNr: number; day: string; visitors: number }[]
    >(
      `
        SELECT
          v.[store_id] AS [storeId],
          CAST(s.[nr] AS int) AS [storeNr],
          CONVERT(char(10), v.[visit_date], 23) AS [day],
          v.[visitor_count] AS [visitors]
        FROM [dbo].[store_visitor_counts] v
        JOIN [dbo].[stores] s ON s.[id] = v.[store_id]
        WHERE s.[firm_nr] = @0 AND v.[visit_date] >= @1 AND v.[visit_date] < @2
      `,
      [firmNr, from, today],
    );

    if (counts.length === 0) {
      return [];
    }

    const days = counts.map((count) => count.day).sort();
    const first = days[0] ?? from;
    const last = days.at(-1) ?? from;
    // Sales receipts only: returns do not change how many customers were served (decision 19).
    const receiptRows = await this.dataSource.query<
      { storeNr: number; day: string; receipts: number }[]
    >(
      `
        SELECT
          [store_nr] AS [storeNr],
          CONVERT(char(10), [sale_date], 23) AS [day],
          COUNT(*) AS [receipts]
        FROM [dbo].[kpi_report_documents]
        WHERE [trcode] = 7
          AND [month_start] BETWEEN @0 AND @1
          AND [sale_date] BETWEEN @2 AND @3
        GROUP BY [store_nr], [sale_date]
      `,
      [`${first.slice(0, 7)}-01`, `${last.slice(0, 7)}-01`, first, last],
    );
    const receipts = new Map(
      receiptRows.map((row) => [`${String(row.storeNr)}|${row.day}`, Number(row.receipts)]),
    );
    const visitors = new Map(
      counts.map((count) => [`${String(count.storeId)}|${count.day}`, Number(count.visitors)]),
    );
    const storeMonths = new Map(
      counts.map((count) => [
        `${String(count.storeId)}|${count.day.slice(0, 7)}`,
        { storeId: count.storeId, storeNr: count.storeNr, month: count.day.slice(0, 7) },
      ]),
    );

    return [...storeMonths.values()].flatMap(({ storeId, storeNr, month }): StoreMonthValue[] => {
      const result = calculateConversion(
        [{ storeId, storeNr }],
        consideredDays(Number(month.slice(0, 4)), Number(month.slice(5, 7)), today),
        receipts,
        visitors,
      );

      return result.value === null
        ? []
        : [
            {
              monthStart: `${month}-01`,
              storeNr,
              kpiCode: STORE_DASHBOARD_CONVERSION_CODE,
              currency: null,
              value: result.value,
              numerator: result.detail.receipts,
              denominator: result.detail.visitors,
            },
          ];
    });
  }
}
