import {
  Inject,
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { getKpiAutoCalculationIntervalMinutes } from '../config/environment.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { periodLabel, periodOrder } from '../kpi-periods/kpi-period-rules.js';
import { KpiResultsService } from './kpi-results.service.js';

export const KPI_AUTO_CALCULATION_JOB = 'kpi-auto-calculation';

/** What the screens may say about the job, e.g. "updated 3 minutes ago, every 10 minutes". */
export interface KpiAutoCalculationStatus {
  /** 0 when the job is switched off. */
  intervalMinutes: number;
  /** End of the last finished run since the API started; null before the first one. */
  lastRunAt: Date | null;
}

/**
 * Recalculates every open KPI period on a fixed interval (ADR-047), so scores and the
 * leaderboard follow Tiger without anyone pressing "Hesapla". The interval comes from
 * `KPI_AUTO_CALCULATION_INTERVAL_MINUTES` (default 10, 0 = off).
 *
 * - Months that have not started yet are skipped: Tiger has nothing for them.
 * - A run never overlaps the previous one; a tick that finds a run in progress is dropped.
 * - It runs outside any request, so its writes are stamped as the system (NULL actor).
 * - Like the nightly file cleanup, it assumes a single API replica (ADR-014).
 */
@Injectable()
export class KpiAutoCalculationService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(KpiAutoCalculationService.name);
  private readonly intervalMinutes = getKpiAutoCalculationIntervalMinutes();
  private running = false;
  private lastRunAt: Date | null = null;

  constructor(
    @Inject(KpiResultsService) private readonly kpiResultsService: KpiResultsService,
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @Inject(SchedulerRegistry) private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onApplicationBootstrap(): void {
    if (this.intervalMinutes === 0) {
      this.logger.log(
        'Automatic KPI calculation is off (KPI_AUTO_CALCULATION_INTERVAL_MINUTES=0).',
      );
      return;
    }

    const handle = setInterval(() => {
      void this.runOnce();
    }, this.intervalMinutes * 60_000);

    this.schedulerRegistry.addInterval(KPI_AUTO_CALCULATION_JOB, handle);
    this.logger.log(`Open KPI periods are recalculated every ${this.intervalMinutes} minutes.`);
  }

  onApplicationShutdown(): void {
    if (this.schedulerRegistry.doesExist('interval', KPI_AUTO_CALCULATION_JOB)) {
      this.schedulerRegistry.deleteInterval(KPI_AUTO_CALCULATION_JOB);
    }
  }

  status(): KpiAutoCalculationStatus {
    return { intervalMinutes: this.intervalMinutes, lastRunAt: this.lastRunAt };
  }

  /** One pass over the open periods; returns false when a pass was already running. */
  async runOnce(now: Date = new Date()): Promise<boolean> {
    if (this.running) {
      this.logger.warn('Previous KPI calculation is still running; this tick is skipped.');
      return false;
    }

    this.running = true;
    const startedAt = Date.now();

    try {
      const current = periodOrder({ year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 });
      const periods = (await this.periodRepository.find({ where: { status: 'open' } })).filter(
        (period) => periodOrder(period) <= current,
      );

      let changed = 0;

      for (const period of periods) {
        changed += await this.recalculate(period);
      }

      this.lastRunAt = new Date();
      this.logger.log(
        `Automatic KPI calculation: ${periods.length} open periods, ${changed} plans updated, ${Date.now() - startedAt} ms.`,
      );
      return true;
    } catch (error: unknown) {
      this.logger.error(`Automatic KPI calculation failed: ${describe(error)}`);
      return true;
    } finally {
      this.running = false;
    }
  }

  /** One period; a failure is logged and the other periods still run. Returns plans written. */
  private async recalculate(period: KpiPeriodEntity): Promise<number> {
    const label = periodLabel(period);

    try {
      const result = await this.kpiResultsService.recalculateOpenPeriod(period);

      if (result.changed > 0) {
        this.logger.log(
          `KPI period ${label}: ${result.changed} of ${result.calculated} plans updated.`,
        );
      }

      return result.changed;
    } catch (error: unknown) {
      this.logger.error(`KPI period ${label} could not be recalculated: ${describe(error)}`);
      return 0;
    }
  }
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
