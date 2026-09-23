import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, type EntityManager, In, Repository } from 'typeorm';

import type { AuditValue } from '../audit/audit-changes.js';
import { AuditService } from '../audit/audit.service.js';
import { readKpiDefinitionName } from '../kpi-definitions/kpi-definition-response.js';
import { KpiAssignmentItemEntity } from '../kpi-assignments/entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from '../kpi-assignments/entities/kpi-assignment.entity.js';
import { kpiAssignmentBadRequest } from '../kpi-assignments/kpi-assignment-errors.js';
import {
  type EntityLookup,
  buildEntityLookups,
  loadStoreNumbers,
  matchRows,
} from '../kpi-assignments/kpi-entity-lookup.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { kpiPeriodClosed } from '../kpi-periods/kpi-period-errors.js';
import { isPeriodOpen, periodLabel } from '../kpi-periods/kpi-period-rules.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import type { SaveKpiActualsDto } from './dto/save-kpi-actuals.dto.js';
import { KpiResultEntity, type KpiResultSource } from './entities/kpi-result.entity.js';
import type {
  KpiPeriodCalculationResponse,
  KpiPlanResultsResponse,
  KpiResultResponse,
} from './kpi-result-response.js';
import { isCalculableKpi, planScore, sameResults, scoreRow } from './kpi-result-rules.js';

/** One row of `dbo.kpi_month_values(@month_start)`. */
interface MonthValueRow {
  kpiCode: string;
  entityRef: number;
  currency: string | null;
  /** Item group KPIs only (`dbo.kpi_month_group_values`, ADR-045); NULL otherwise. */
  groupCode: string | null;
  value: number | string | null;
}

/** What one scheduled pass over a period did (ADR-047). */
export interface KpiPeriodRecalculation {
  /** Plans in the period. */
  calculated: number;
  /** Plans whose results moved and were written. */
  changed: number;
  incomplete: number;
  calculatedAt: Date;
}

/** A result before it is written: the plan row, what it achieved and the score it earned. */
interface ResultValues {
  assignmentId: string;
  assignmentItemId: string;
  kpiDefinitionId: string;
  targetValue: number | null;
  actualValue: number | null;
  source: KpiResultSource;
  rawAchievement: number | null;
  cappedAchievement: number | null;
  weightedScore: number | null;
  weight: number;
  calculatedAt: Date | null;
}

/** The plan and everything the calculation reads from it. */
interface PlanData {
  assignment: KpiAssignmentEntity;
  period: KpiPeriodEntity;
  items: KpiAssignmentItemEntity[];
}

/**
 * KPI results (ADR-041): what every plan row achieved in its month and the score it earned.
 *
 * The measures are not computed here. `dbo.kpi_month_values(@month_start)` reads the same
 * `kpi_report_documents` view the target reports use (ADR-038), so the Tiger rules of
 * docs/TIGER_DATA.md keep a single implementation. KPIs Tiger cannot measure
 * (`STORE_CONVERSION`) are typed in by a manager and are never overwritten by a
 * recalculation.
 */
@Injectable()
export class KpiResultsService {
  constructor(
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @InjectRepository(KpiAssignmentItemEntity)
    private readonly itemRepository: Repository<KpiAssignmentItemEntity>,
    @InjectRepository(KpiResultEntity)
    private readonly resultRepository: Repository<KpiResultEntity>,
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  /** The stored results; the plan owner and `full_access` users may read them. */
  async forAssignment(
    id: string,
    requester: { id: string; fullAccess: boolean },
  ): Promise<KpiPlanResultsResponse> {
    const plan = await this.loadPlan(id);

    if (
      !requester.fullAccess &&
      plan.assignment.employeeId.toLowerCase() !== requester.id.toLowerCase()
    ) {
      throw new ForbiddenException('This KPI plan belongs to another employee.');
    }

    const results = await this.resultRepository.find({
      where: { assignmentId: plan.assignment.id },
    });

    return this.toResponse(plan, results);
  }

  /** Reads the month from Tiger and writes the plan's results. Only in an open period. */
  async calculate(id: string): Promise<KpiPlanResultsResponse> {
    const plan = await this.loadPlan(id);

    this.assertOpen(plan.period);

    const monthRows = await this.readMonthValues(monthStart(plan.period));
    const lookups = await this.buildLookups([plan]);
    const existing = await this.loadResults([plan.assignment.id]);
    const calculatedAt = new Date();
    const values = this.buildResults(plan, lookups, monthRows, existing, calculatedAt);

    await this.dataSource.transaction(async (manager) => {
      await this.writeResults(manager, plan, values, 'calculate');
    });

    return this.forAssignment(id, { id: plan.assignment.employeeId, fullAccess: true });
  }

  /** Writes the actual values of the KPIs Tiger cannot measure and rescores the plan. */
  async setActuals(id: string, dto: SaveKpiActualsDto): Promise<KpiPlanResultsResponse> {
    const plan = await this.loadPlan(id);

    this.assertOpen(plan.period);

    const byId = new Map(plan.items.map((item) => [item.id.toLowerCase(), item]));
    const actuals = new Map<string, number | null>();

    for (const entry of dto.items) {
      const item = byId.get(entry.id.toLowerCase());

      if (!item) {
        throw kpiAssignmentBadRequest(
          'KPI_ASSIGNMENT_UNKNOWN_ITEM',
          'items[] holds a row of another plan.',
          { itemId: entry.id },
        );
      }

      if (isCalculableKpi(item.definition?.code ?? '')) {
        throw kpiAssignmentBadRequest(
          'KPI_ASSIGNMENT_CALCULATED_ITEM',
          `${item.definition?.code ?? 'This KPI'} is read from Tiger and cannot be typed in.`,
          { itemId: item.id },
        );
      }

      actuals.set(item.id.toLowerCase(), entry.actualValue ?? null);
    }

    const existing = await this.loadResults([plan.assignment.id]);
    const values = this.buildResults(plan, new Map(), [], existing, null, actuals);

    await this.dataSource.transaction(async (manager) => {
      await this.writeResults(manager, plan, values, 'actuals');
    });

    return this.forAssignment(id, { id: plan.assignment.employeeId, fullAccess: true });
  }

  /** Calculates every plan of a period; Tiger is read once for the whole month. */
  async calculatePeriod(periodId: string): Promise<KpiPeriodCalculationResponse> {
    const period = await this.periodRepository.findOne({ where: { id: periodId } });

    if (!period) {
      throw new NotFoundException('KPI period not found.');
    }

    this.assertOpen(period);

    const { calculated, incomplete, calculatedAt } = await this.calculatePlans(period, {
      via: 'calculate-period',
      skipUnchanged: false,
    });

    return { calculated, incomplete, calculatedAt };
  }

  /**
   * The scheduled recalculation of one open period (ADR-047). Plans whose results would not
   * change are left alone, so neither `kpi_results` nor the audit log churns every few
   * minutes; a period closed in the meantime is skipped rather than failed.
   */
  async recalculateOpenPeriod(period: KpiPeriodEntity): Promise<KpiPeriodRecalculation> {
    const current = await this.periodRepository.findOne({ where: { id: period.id } });

    if (!current || !isPeriodOpen(current)) {
      return { calculated: 0, changed: 0, incomplete: 0, calculatedAt: new Date() };
    }

    return this.calculatePlans(current, { via: 'scheduled', skipUnchanged: true });
  }

  private async calculatePlans(
    period: KpiPeriodEntity,
    options: { via: string; skipUnchanged: boolean },
  ): Promise<KpiPeriodRecalculation> {
    const assignments = await this.assignmentRepository.find({
      where: { periodId: period.id },
      relations: { employee: true },
    });

    if (assignments.length === 0) {
      return { calculated: 0, changed: 0, incomplete: 0, calculatedAt: new Date() };
    }

    const items = await this.loadItems(assignments.map((assignment) => assignment.id));
    const plans = assignments.map((assignment) => ({
      assignment,
      period,
      items: items.filter(
        (item) => item.assignmentId.toLowerCase() === assignment.id.toLowerCase(),
      ),
    }));
    const monthRows = await this.readMonthValues(monthStart(period));
    const lookups = await this.buildLookups(plans);
    const existing = await this.loadResults(assignments.map((assignment) => assignment.id));
    const calculatedAt = new Date();
    let incomplete = 0;
    let changed = 0;

    await this.dataSource.transaction(async (manager) => {
      for (const plan of plans) {
        const values = this.buildResults(plan, lookups, monthRows, existing, calculatedAt);
        const score = planScore(values);

        if (score.scoredItemCount < score.itemCount) {
          incomplete += 1;
        }

        if (options.skipUnchanged && this.isUnchanged(plan, values, existing)) {
          continue;
        }

        changed += 1;
        await this.writeResults(manager, plan, values, options.via);
      }
    });

    return { calculated: plans.length, changed, incomplete, calculatedAt };
  }

  /** The stored results and total already say what `values` would write. */
  private isUnchanged(
    plan: PlanData,
    values: ResultValues[],
    existing: Map<string, KpiResultEntity>,
  ): boolean {
    const assignmentId = plan.assignment.id.toLowerCase();
    const stored = [...existing.values()].filter(
      (result) => result.assignmentId.toLowerCase() === assignmentId,
    );
    const score = planScore(values);

    return (
      plan.assignment.scoreCalculatedAt !== null &&
      plan.assignment.totalScore === score.totalScore &&
      plan.assignment.scoredItemCount === score.scoredItemCount &&
      sameResults(stored, values)
    );
  }

  private assertOpen(period: KpiPeriodEntity): void {
    if (!isPeriodOpen(period)) {
      throw kpiPeriodClosed(periodLabel(period));
    }
  }

  private async loadPlan(id: string): Promise<PlanData> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: { employee: true, period: true },
    });

    if (!assignment?.period) {
      throw new NotFoundException('KPI plan not found.');
    }

    return { assignment, period: assignment.period, items: await this.loadItems([assignment.id]) };
  }

  private loadItems(assignmentIds: string[]): Promise<KpiAssignmentItemEntity[]> {
    return this.itemRepository.find({
      where: { assignmentId: In(assignmentIds) },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });
  }

  private async loadResults(assignmentIds: string[]): Promise<Map<string, KpiResultEntity>> {
    const results = await this.resultRepository.find({
      where: { assignmentId: In(assignmentIds) },
    });

    return new Map(results.map((result) => [result.assignmentItemId.toLowerCase(), result]));
  }

  /** Plan row id → the Tiger entities it is measured on, for every plan given. */
  private async buildLookups(plans: PlanData[]): Promise<Map<string, EntityLookup>> {
    const items = plans.flatMap((plan) => plan.items);
    const storeNumbers = await loadStoreNumbers(this.storeRepository, items);
    const lookups = plans.flatMap((plan) =>
      buildEntityLookups(plan.items, {
        erpEmployeeId: plan.assignment.employee?.erpEmployeeId,
        storeNumbers,
      }),
    );

    return new Map(lookups.map((lookup) => [lookup.itemId.toLowerCase(), lookup]));
  }

  /** The month's values of every KPI Tiger measures, the item group ones included. */
  private readMonthValues(month: string): Promise<MonthValueRow[]> {
    return this.dataSource.query<MonthValueRow[]>(
      `
        SELECT
          [kpi_code] AS [kpiCode],
          [entity_ref] AS [entityRef],
          [currency] AS [currency],
          CAST(NULL AS nvarchar(25)) AS [groupCode],
          [value] AS [value]
        FROM [dbo].[kpi_month_values](@0)
        UNION ALL
        SELECT
          [kpi_code],
          [entity_ref],
          [currency],
          [group_code],
          [value]
        FROM [dbo].[kpi_month_group_values](@0)
      `,
      [month],
    );
  }

  /**
   * One result per plan row. Tiger rows are summed over the stores the row covers (exact
   * for money and receipts, an approximation for customer counts, docs/REPORTS.md); rows
   * Tiger cannot measure keep the value a manager typed in.
   */
  private buildResults(
    plan: PlanData,
    lookups: Map<string, EntityLookup>,
    monthRows: MonthValueRow[],
    existing: Map<string, KpiResultEntity>,
    calculatedAt: Date | null,
    manualActuals: Map<string, number | null> = new Map(),
  ): ResultValues[] {
    return plan.items.map((item) => {
      const key = item.id.toLowerCase();
      const previous = existing.get(key);
      const calculable = isCalculableKpi(item.definition?.code ?? '');
      const lookup = lookups.get(key);
      let actualValue: number | null;
      let source: KpiResultSource;
      let rowCalculatedAt: Date | null;

      if (calculable && calculatedAt !== null) {
        // No document for the month means nothing was sold, which is a zero, not a gap.
        actualValue = lookup ? sumValues(matchRows(lookup, monthRows)) : null;
        source = 'calculated';
        rowCalculatedAt = calculatedAt;
      } else if (calculable) {
        actualValue = previous?.actualValue ?? null;
        source = 'calculated';
        rowCalculatedAt = previous?.calculatedAt ?? null;
      } else {
        actualValue = manualActuals.has(key)
          ? (manualActuals.get(key) ?? null)
          : (previous?.actualValue ?? null);
        source = 'manual';
        rowCalculatedAt = manualActuals.has(key) ? new Date() : (previous?.calculatedAt ?? null);
      }

      return {
        assignmentId: plan.assignment.id,
        assignmentItemId: item.id,
        kpiDefinitionId: item.kpiDefinitionId,
        targetValue: item.targetValue,
        actualValue,
        source,
        weight: item.weight,
        calculatedAt: rowCalculatedAt,
        ...scoreRow({
          targetValue: item.targetValue,
          actualValue,
          weight: item.weight,
        }),
      };
    });
  }

  /**
   * Replaces the plan's results and writes its total. The result rows are not logged one
   * by one; the plan's own entry carries them, like a template's KPI rows (ADR-036).
   */
  private async writeResults(
    manager: EntityManager,
    plan: PlanData,
    values: ResultValues[],
    via: string,
  ): Promise<void> {
    const score = planScore(values);

    await this.audit.delete(
      manager,
      KpiResultEntity,
      { assignmentId: plan.assignment.id },
      { log: false },
    );

    if (values.length > 0) {
      await this.audit.insertMany(manager, KpiResultEntity, values, { log: false });
    }

    await this.audit.update(
      manager,
      KpiAssignmentEntity,
      { id: plan.assignment.id },
      {
        totalScore: score.totalScore,
        scoredItemCount: score.scoredItemCount,
        ...(via === 'actuals' ? {} : { scoreCalculatedAt: new Date() }),
      },
      {
        context: { via },
        extraChanges: { results: { new: toResultSnapshots(plan, values) } },
      },
    );
  }

  private toResponse(plan: PlanData, results: KpiResultEntity[]): KpiPlanResultsResponse {
    const byItem = new Map(
      results.map((result) => [result.assignmentItemId.toLowerCase(), result]),
    );
    const items = plan.items.flatMap((item): KpiResultResponse[] => {
      const result = byItem.get(item.id.toLowerCase());
      const definition = item.definition;

      if (!result || !definition) {
        return [];
      }

      return [
        {
          itemId: item.id,
          definition: {
            id: definition.id,
            code: definition.code,
            name: readKpiDefinitionName(definition),
            scope: definition.scope,
            unit: definition.unit,
            inputMode: definition.inputMode,
          },
          weight: result.weight,
          targetValue: result.targetValue,
          actualValue: result.actualValue,
          source: result.source,
          rawAchievement: result.rawAchievement,
          cappedAchievement: result.cappedAchievement,
          weightedScore: result.weightedScore,
          calculatedAt: result.calculatedAt,
        },
      ];
    });

    return {
      assignmentId: plan.assignment.id,
      totalScore: results.length === 0 ? null : plan.assignment.totalScore,
      scoredItemCount: items.filter((item) => item.weightedScore !== null).length,
      itemCount: plan.items.length,
      calculatedAt: plan.assignment.scoreCalculatedAt,
      items,
    };
  }
}

/** The first day of the period's month, as SQL Server's `date` reads it. */
function monthStart(period: KpiPeriodEntity): string {
  return `${period.year}-${String(period.month).padStart(2, '0')}-01`;
}

function sumValues(rows: MonthValueRow[]): number {
  return rows.reduce((total, row) => total + Number(row.value ?? 0), 0);
}

/** What the plan's log entry shows about its results (ADR-036). */
function toResultSnapshots(plan: PlanData, values: ResultValues[]): AuditValue {
  const codes = new Map(plan.items.map((item) => [item.id.toLowerCase(), item.definition?.code]));

  return values.map((value) => ({
    code: codes.get(value.assignmentItemId.toLowerCase()) ?? null,
    target: value.targetValue,
    actual: value.actualValue,
    source: value.source,
    score: value.weightedScore,
  }));
}
