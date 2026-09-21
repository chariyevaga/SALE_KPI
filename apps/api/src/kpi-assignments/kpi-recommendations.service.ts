import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { StoreEntity } from '../stores/entities/store.entity.js';
import { KpiAssignmentItemEntity } from './entities/kpi-assignment-item.entity.js';
import { KpiAssignmentEntity } from './entities/kpi-assignment.entity.js';
import {
  type EntityLookup,
  buildEntityLookups,
  loadStoreNumbers,
  matchRows,
} from './kpi-entity-lookup.js';
import type {
  KpiAssignmentRecommendationResponse,
  KpiAssignmentRecommendationsResponse,
} from './kpi-assignment-response.js';

/** One row of `dbo.kpi_report_summary` (ADR-038, docs/REPORTS.md). */
interface ReportRow {
  kpiCode: string;
  entityRef: number;
  currency: string | null;
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

    return { items: this.summarise(lookups, await this.readReportRows(lookups)) };
  }

  private async readReportRows(lookups: EntityLookup[]): Promise<ReportRow[]> {
    const codes = [...new Set(lookups.map((lookup) => lookup.kpiCode))];
    const refs = [...new Set(lookups.flatMap((lookup) => lookup.entityRefs))];

    if (codes.length === 0 || refs.length === 0) {
      return [];
    }

    const parameters = [...codes, ...refs];
    const codeParameters = codes.map((_, index) => `@${index}`).join(', ');
    const refParameters = refs.map((_, index) => `@${codes.length + index}`).join(', ');

    return this.dataSource.query<ReportRow[]>(
      `
        SELECT
          [kpi_code] AS [kpiCode],
          [entity_ref] AS [entityRef],
          [currency] AS [currency],
          [month_count] AS [monthCount],
          [average_value] AS [average],
          [achievable_max_target] AS [achievableMax],
          [recommended_target] AS [recommended]
        FROM [dbo].[kpi_report_summary]
        WHERE [kpi_code] IN (${codeParameters}) AND [entity_ref] IN (${refParameters})
      `,
      parameters,
    );
  }

  /**
   * One suggestion per plan row. Several stores are added up, which is exact for money and
   * receipts and an approximation for customer counts (docs/REPORTS.md).
   */
  private summarise(
    lookups: EntityLookup[],
    rows: ReportRow[],
  ): KpiAssignmentRecommendationResponse[] {
    return lookups.flatMap((lookup) => {
      const matching = matchRows(lookup, rows);

      if (matching.length === 0) {
        return [];
      }

      return [
        {
          itemId: lookup.itemId,
          monthCount: Math.max(...matching.map((row) => Number(row.monthCount))),
          average: round(sum(matching.map((row) => toNumber(row.average))), 2),
          achievableMax: round(sum(matching.map((row) => toNumber(row.achievableMax))), 0),
          recommended: round(sum(matching.map((row) => toNumber(row.recommended))), 0),
          ...(matching.length > 1 ? { combined: true } : {}),
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
