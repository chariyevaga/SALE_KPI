import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import type { ListKpiPeriodsQueryDto, SaveKpiPeriodDto } from './dto/save-kpi-period.dto.js';
import { KpiPeriodEntity } from './entities/kpi-period.entity.js';
import {
  kpiPeriodAlreadyOpen,
  kpiPeriodClosed,
  kpiPeriodReopenExpired,
} from './kpi-period-errors.js';
import {
  type KpiPeriodListResponse,
  type KpiPeriodPlanStats,
  type KpiPeriodResponse,
  toKpiPeriodResponse,
} from './kpi-period-response.js';
import { canReopenPeriod, isPeriodOpen, periodLabel, reopenableUntil } from './kpi-period-rules.js';

const DEFAULT_PAGE_SIZE = 24;

function isUniqueViolation(error: unknown): boolean {
  const number = (error as { driverError?: { number?: number } }).driverError?.number;
  return number === 2_601 || number === 2_627;
}

@Injectable()
export class KpiPeriodsService {
  constructor(
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async list(query: ListKpiPeriodsQueryDto): Promise<KpiPeriodListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const builder = this.periodRepository
      .createQueryBuilder('period')
      .orderBy('period.year', 'DESC')
      .addOrderBy('period.month', 'DESC');

    if (query.status !== undefined) {
      builder.andWhere('period.status = :status', { status: query.status });
    }

    const [periods, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const stats = await this.loadPlanStats(periods.map((period) => period.id));

    return {
      items: periods.map((period) =>
        toKpiPeriodResponse(period, stats.get(period.id.toLowerCase())),
      ),
      limit,
      page,
      total,
    };
  }

  /** The month's period, created on first use so screens never have to open it first. */
  async ensure(dto: SaveKpiPeriodDto): Promise<KpiPeriodResponse> {
    const existing = await this.periodRepository.findOneBy({ year: dto.year, month: dto.month });

    if (existing) {
      return toKpiPeriodResponse(existing, await this.loadPlanStatsOf(existing.id));
    }

    try {
      const created = await this.audit.insert(this.dataSource.manager, KpiPeriodEntity, {
        year: dto.year,
        month: dto.month,
        status: 'open',
        closedAt: null,
      });

      return toKpiPeriodResponse(created);
    } catch (error: unknown) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      // A concurrent request opened the same month; its row is the one to return.
      const period = await this.periodRepository.findOneByOrFail({
        year: dto.year,
        month: dto.month,
      });

      return toKpiPeriodResponse(period, await this.loadPlanStatsOf(period.id));
    }
  }

  async get(id: string): Promise<KpiPeriodResponse> {
    const period = await this.findOrFail(id);

    return toKpiPeriodResponse(period, await this.loadPlanStatsOf(period.id));
  }

  /** Closing freezes the period: plans and targets can no longer be written (ADR-039). */
  async close(id: string): Promise<KpiPeriodResponse> {
    const period = await this.findOrFail(id);

    if (!isPeriodOpen(period)) {
      throw kpiPeriodClosed(periodLabel(period));
    }

    await this.audit.update(
      this.dataSource.manager,
      KpiPeriodEntity,
      { id: period.id },
      { status: 'closed', closedAt: new Date() },
    );

    return this.get(period.id);
  }

  /**
   * Undoes a closing made too early (ADR-044): allowed until the 10th day after the month
   * ends. Plans, targets and results become writable again; recalculating is up to the user.
   */
  async reopen(id: string): Promise<KpiPeriodResponse> {
    const period = await this.findOrFail(id);

    if (isPeriodOpen(period)) {
      throw kpiPeriodAlreadyOpen(periodLabel(period));
    }

    if (!canReopenPeriod(period, new Date())) {
      throw kpiPeriodReopenExpired(periodLabel(period), reopenableUntil(period));
    }

    await this.audit.update(
      this.dataSource.manager,
      KpiPeriodEntity,
      { id: period.id },
      { status: 'open', closedAt: null },
    );

    return this.get(period.id);
  }

  private async findOrFail(id: string): Promise<KpiPeriodEntity> {
    const period = await this.periodRepository.findOneBy({ id });

    if (!period) {
      throw new NotFoundException('KPI period not found.');
    }

    return period;
  }

  private async loadPlanStatsOf(periodId: string): Promise<KpiPeriodPlanStats | undefined> {
    const stats = await this.loadPlanStats([periodId]);

    return stats.get(periodId.toLowerCase());
  }

  /** One grouped query for the whole page instead of one per period. */
  private async loadPlanStats(periodIds: string[]): Promise<Map<string, KpiPeriodPlanStats>> {
    if (periodIds.length === 0) {
      return new Map();
    }

    const rows = await this.assignmentRepository
      .createQueryBuilder('assignment')
      .select('assignment.periodId', 'periodId')
      .addSelect('COUNT(DISTINCT assignment.id)', 'assignmentCount')
      .addSelect(
        'COUNT(DISTINCT CASE WHEN item.target_value IS NULL THEN assignment.id END)',
        'missingTargetCount',
      )
      .leftJoin('kpi_assignment_items', 'item', 'item.assignment_id = assignment.id')
      .where({ periodId: In(periodIds) })
      .groupBy('assignment.periodId')
      .getRawMany<{ periodId: string; assignmentCount: number; missingTargetCount: number }>();

    return new Map(
      rows.map((row) => [
        row.periodId.toLowerCase(),
        {
          assignmentCount: Number(row.assignmentCount),
          missingTargetCount: Number(row.missingTargetCount),
        },
      ]),
    );
  }
}
