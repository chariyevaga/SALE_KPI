import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CONVERSION_KPI_CODE } from '../kpi-results/conversion-rules.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiAssignmentItemEntity } from './entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from './entities/kpi-assignment.entity.js';
import {
  type EntityLookup,
  buildEntityLookups,
  loadStoreNumbers,
  matchRows,
} from './kpi-entity-lookup.js';
import { weightedAverage } from './kpi-recommendation-rules.js';
import type {
  KpiAssignmentRecommendationResponse,
  KpiAssignmentRecommendationsResponse,
} from './kpi-assignment-response.js';

/**
 * One row of `dbo.kpi_report_summary` (ADR-038, docs/REPORTS.md) or, for item group KPIs,
 * of `dbo.kpi_report_group_summary`, which adds the group (ADR-045).
 */
interface ReportRow {
  kpiCode: string;
  entityRef: number;
  currency: string | null;
  groupCode?: string | null;
  monthCount: number;
  average: number | null;
  achievableMax: number | null;
  recommended: number | null;
}

function sum(values: Array<number | null>): number | null {
  const numbers = values.filter((value): value is number => value !== null);

  return numbers.length === 0 ? null : numbers.reduce((total, value) => total + value, 0);
}

/**
 * Target suggestions for a plan, read from the KPI report views (ADR-038). The reports
 * compute the last 12 complete months from Tiger at query time; this is the one place
 * where an API request reads them, so that targets can be set next to what the store or
 * the salesperson actually did (docs/REPORTS.md).
 */
@Injectable()
export class KpiRecommendationsService {
  constructor(
    @InjectRepository(KpiAssignmentEntity)
    private readonly assignmentRepository: Repository<KpiAssignmentEntity>,
    @InjectRepository(KpiAssignmentItemEntity)
    private readonly itemRepository: Repository<KpiAssignmentItemEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
  ) {}

  async forAssignment(assignmentId: string): Promise<KpiAssignmentRecommendationsResponse> {
    const assignment = await this.assignmentRepository.findOne({
      where: { id: assignmentId },
      relations: { employee: true },
    });

    if (!assignment) {
      throw new NotFoundException('KPI plan not found.');
    }

    const items = await this.itemRepository.find({
      where: { assignmentId: assignment.id },
      relations: { definition: true },
      order: { sortOrder: 'ASC' },
    });
    const storeNumbers = await loadStoreNumbers(this.storeRepository, items);
    const lookups = buildEntityLookups(items, {
      erpEmployeeId: assignment.employee?.erpEmployeeId,
      storeNumbers,
    });

    const [rows, conversionWeights] = await Promise.all([
      this.readReportRows(lookups),
      this.readConversionWeights(lookups),
    ]);

    return { items: this.summarise(lookups, rows, conversionWeights) };
  }

  /**
   * Visitors of the counted months per store, the weight of each store's conversion when a
   * row covers several stores (ADR-057). Only read when such a row exists.
   */
  private async readConversionWeights(lookups: EntityLookup[]): Promise<Map<number, number>> {
    const refs = [
      ...new Set(
        lookups
          .filter(
            (lookup) => lookup.kpiCode === CONVERSION_KPI_CODE && lookup.entityRefs.length > 1,
          )
          .flatMap((lookup) => lookup.entityRefs),
      ),
    ];

    if (refs.length === 0) {
      return new Map();
    }

    const rows = await this.dataSource.query<{ storeNr: number; visitors: number | string }[]>(
      `
        SELECT [store_nr] AS [storeNr], SUM([visitors]) AS [visitors]
        FROM [dbo].[kpi_report_conversion_monthly]
        WHERE [value] IS NOT NULL AND [store_nr] IN (${refs.map((_, index) => `@${String(index)}`).join(', ')})
        GROUP BY [store_nr]
      `,
      refs,
    );

    return new Map(rows.map((row) => [Number(row.storeNr), Number(row.visitors)]));
  }

  private async readReportRows(lookups: EntityLookup[]): Promise<ReportRow[]> {
    const [plain, grouped] = await Promise.all([
      this.readSummary(
        lookups.filter((lookup) => lookup.groupCodes === undefined),
        false,
      ),
      this.readSummary(
        lookups.filter((lookup) => lookup.groupCodes !== undefined),
        true,
      ),
    ]);

    return [...plain, ...grouped];
  }

  /** One query per summary view, filtered to the KPIs, entities and groups asked for. */
  private async readSummary(lookups: EntityLookup[], grouped: boolean): Promise<ReportRow[]> {
    const codes = [...new Set(lookups.map((lookup) => lookup.kpiCode))];
    const refs = [...new Set(lookups.flatMap((lookup) => lookup.entityRefs))];
    const groups = [...new Set(lookups.flatMap((lookup) => lookup.groupCodes ?? []))];

    if (codes.length === 0 || refs.length === 0 || (grouped && groups.length === 0)) {
      return [];
    }

    const parameters = [...codes, ...refs, ...(grouped ? groups : [])];
    const list = (values: unknown[], offset: number) =>
      values.map((_, index) => `@${offset + index}`).join(', ');

    return this.dataSource.query<ReportRow[]>(
      `
        SELECT
          [kpi_code] AS [kpiCode],
          [entity_ref] AS [entityRef],
          [currency] AS [currency],
          ${grouped ? '[group_code] AS [groupCode],' : ''}
          [month_count] AS [monthCount],
          [average_value] AS [average],
          [achievable_max_target] AS [achievableMax],
          [recommended_target] AS [recommended]
        FROM [dbo].[${grouped ? 'kpi_report_group_summary' : 'kpi_report_summary'}]
        WHERE [kpi_code] IN (${list(codes, 0)})
          AND [entity_ref] IN (${list(refs, codes.length)})
          ${grouped ? `AND [group_code] IN (${list(groups, codes.length + refs.length)})` : ''}
      `,
      parameters,
    );
  }

  /**
   * One suggestion per plan row. Several stores (and, for item group KPIs, several groups)
   * are added up, which is exact for money and receipts and an approximation for customer
   * counts (docs/REPORTS.md). The conversion is a rate: its stores are averaged with their
   * visitors as the weight, and it keeps two decimals (ADR-057).
   */
  private summarise(
    lookups: EntityLookup[],
    rows: ReportRow[],
    conversionWeights: Map<number, number>,
  ): KpiAssignmentRecommendationResponse[] {
    return lookups.flatMap((lookup) => {
      const matching = matchRows(lookup, rows);

      if (matching.length === 0) {
        return [];
      }

      const isRate = lookup.kpiCode === CONVERSION_KPI_CODE;
      const combine = (pick: (row: ReportRow) => number | null) =>
        isRate
          ? weightedAverage(
              matching.map((row) => ({
                value: toNumber(pick(row)),
                weight: conversionWeights.get(Number(row.entityRef)) ?? 0,
              })),
            )
          : sum(matching.map((row) => toNumber(pick(row))));
      const targetDecimals = isRate ? 2 : 0;

      return [
        {
          itemId: lookup.itemId,
          monthCount: Math.max(...matching.map((row) => Number(row.monthCount))),
          average: round(
            combine((row) => row.average),
            2,
          ),
          achievableMax: round(
            combine((row) => row.achievableMax),
            targetDecimals,
          ),
          recommended: round(
            combine((row) => row.recommended),
            targetDecimals,
          ),
          // "Several stores added up": groups of one store are exact sums and need no note.
          ...(new Set(matching.map((row) => Number(row.entityRef))).size > 1
            ? { combined: true }
            : {}),
        },
      ];
    });
  }
}

function toNumber(value: number | null): number | null {
  return value === null ? null : Number(value);
}

function round(value: number | null, decimals: number): number | null {
  if (value === null) {
    return null;
  }

  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
}
