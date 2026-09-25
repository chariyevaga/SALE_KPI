import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { readSheet } from 'read-excel-file/node';
import { Between, DataSource, In, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { getBusinessTimeZone, getFirmNumber } from '../config/environment.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { kpiPeriodClosed } from '../kpi-periods/kpi-period-errors.js';
import { isPeriodOpen, periodLabel } from '../kpi-periods/kpi-period-rules.js';
import { dateInZone } from '../kpi-results/conversion-rules.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import type {
  ListStoreVisitorCountsQueryDto,
  SaveStoreVisitorCountDto,
  StoreVisitorCountTemplateQueryDto,
} from './dto/store-visitor-count.dto.js';
import { StoreVisitorCountEntity } from './entities/store-visitor-count.entity.js';
import { storeVisitorCountBadRequest } from './store-visitor-count-errors.js';
import {
  type StoreVisitorCountImportResponse,
  type StoreVisitorCountListResponse,
  type StoreVisitorCountResponse,
  toStoreVisitorCountResponse,
} from './store-visitor-count-response.js';
import { isFutureVisitDate, visitMonth } from './store-visitor-count-rules.js';
import {
  daysBetween,
  type ImportRowError,
  MAX_IMPORT_ROWS,
  MAX_REPORTED_ROW_ERRORS,
  MAX_TEMPLATE_DAYS,
  parseImportSheet,
  previousDay,
} from './visitor-count-import-rules.js';
import { buildVisitorCountTemplate } from './visitor-count-template.js';

export interface VisitorCountTemplateFile {
  content: Buffer;
  fileName: string;
}

/** SQL Server takes at most 2,100 parameters; id lists are cut well below that. */
const IDS_PER_UPDATE = 1_000;

/** audit_logs.context of every row an import writes, shown as "from Excel". */
const IMPORT_CONTEXT = { via: 'excel-import' } as const;

const DEFAULT_PAGE_SIZE = 20;

function isUniqueViolation(error: unknown): boolean {
  const number = (error as { driverError?: { number?: number } }).driverError?.number;
  return number === 2_601 || number === 2_627;
}

@Injectable()
export class StoreVisitorCountsService {
  constructor(
    @InjectRepository(StoreVisitorCountEntity)
    private readonly countRepository: Repository<StoreVisitorCountEntity>,
    @InjectRepository(StoreEntity)
    private readonly storeRepository: Repository<StoreEntity>,
    @InjectRepository(KpiPeriodEntity)
    private readonly periodRepository: Repository<KpiPeriodEntity>,
    @Inject(DataSource) private readonly dataSource: DataSource,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** Counts newest day first; filtered by store and a date range when given. */
  async list(query: ListStoreVisitorCountsQueryDto): Promise<StoreVisitorCountListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? DEFAULT_PAGE_SIZE;
    const builder = this.countRepository
      .createQueryBuilder('visit')
      .orderBy('visit.visitDate', 'DESC')
      .addOrderBy('visit.storeId', 'ASC');

    if (query.storeId !== undefined) {
      builder.andWhere('visit.storeId = :storeId', { storeId: query.storeId });
    }

    if (query.from !== undefined) {
      builder.andWhere('visit.visitDate >= :from', { from: query.from });
    }

    if (query.to !== undefined) {
      builder.andWhere('visit.visitDate <= :to', { to: query.to });
    }

    const [rows, total] = await builder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    const stores = await this.loadStores(rows.map((row) => row.storeId));

    return {
      items: rows.map((row) => toStoreVisitorCountResponse(row, stores.get(row.storeId))),
      limit,
      page,
      total,
    };
  }

  /**
   * Writes the store's count for the day: the first entry creates the row, a later one
   * replaces the number. Both are logged with the person who entered them (ADR-036).
   */
  async save(dto: SaveStoreVisitorCountDto): Promise<StoreVisitorCountResponse> {
    const store = await this.storeRepository.findOneBy({
      id: dto.storeId,
      firmNr: getFirmNumber(),
    });

    if (!store) {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_UNKNOWN_STORE',
        'storeId is not a store of the configured firm.',
      );
    }

    if (isFutureVisitDate(dto.date, new Date())) {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_FUTURE_DATE',
        'date is in the future.',
      );
    }

    await this.assertMonthOpen(dto.date);

    const where = { storeId: dto.storeId, visitDate: dto.date };
    const existing = await this.countRepository.findOneBy(where);

    if (existing) {
      return this.replaceCount(existing.id, dto.visitorCount, store);
    }

    try {
      const created = await this.audit.insert(this.dataSource.manager, StoreVisitorCountEntity, {
        storeId: dto.storeId,
        visitDate: dto.date,
        visitorCount: dto.visitorCount,
      });

      return toStoreVisitorCountResponse(created, store);
    } catch (error: unknown) {
      if (!isUniqueViolation(error)) {
        throw error;
      }

      // Someone entered the same store and day a moment earlier; this entry replaces it.
      const row = await this.countRepository.findOneByOrFail(where);

      return this.replaceCount(row.id, dto.visitorCount, store);
    }
  }

  /**
   * The Excel template (ADR-055): one row per store and day of the range with the count
   * already saved, so the same file both enters new counts and corrects old ones.
   */
  async template(query: StoreVisitorCountTemplateQueryDto): Promise<VisitorCountTemplateFile> {
    const today = dateInZone(new Date(), getBusinessTimeZone());
    const from = query.from ?? query.to ?? previousDay(today);
    const to = query.to ?? from;
    const days = daysBetween(from, to);

    if (days.length === 0 || days.length > MAX_TEMPLATE_DAYS || to > today) {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_TEMPLATE_RANGE',
        `from..to must be 1-${String(MAX_TEMPLATE_DAYS)} days, not after today.`,
      );
    }

    const stores = await this.firmStores();
    const chosen =
      query.storeId === undefined ? stores : stores.filter((store) => store.id === query.storeId);

    if (chosen.length === 0) {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_UNKNOWN_STORE',
        'storeId is not a store of the configured firm.',
      );
    }

    const saved = await this.countRepository.findBy({
      storeId: In(chosen.map((store) => store.id)),
      visitDate: Between(from, to),
    });
    const savedCounts = new Map(
      saved.map((row) => [`${String(row.storeId)}|${row.visitDate}`, row.visitorCount]),
    );
    const rows = days.flatMap((date) =>
      chosen.map((store) => ({
        date,
        store,
        visitorCount: savedCounts.get(`${String(store.id)}|${date}`) ?? null,
      })),
    );

    return {
      content: await buildVisitorCountTemplate(rows, stores, query.lang ?? 'tr'),
      fileName: `visitor-counts_${from}_${to}.xlsx`,
    };
  }

  /**
   * Reads an uploaded Excel file and writes its counts in one transaction (ADR-055): a new
   * store-day is created, an existing one gets the new number, an equal one is left alone.
   * Every write is logged with `via: excel-import`. If any row is wrong nothing is written
   * and the wrong rows are returned, so the whole file can be fixed at once.
   */
  async importFile(content: Buffer): Promise<StoreVisitorCountImportResponse> {
    let data: unknown[][];

    try {
      data = await readSheet(content);
    } catch {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_IMPORT_FILE',
        'The file is not a readable .xlsx workbook.',
      );
    }

    if (data.length - 1 > MAX_IMPORT_ROWS) {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_IMPORT_TOO_LARGE',
        `At most ${String(MAX_IMPORT_ROWS)} rows can be imported at once.`,
      );
    }

    const parsed = parseImportSheet(data, new Date());
    const errors: ImportRowError[] = [...parsed.errors];
    const storesByNr = new Map((await this.firmStores()).map((store) => [store.nr, store]));
    const closedMonths = await this.closedMonths(parsed.rows.map((row) => row.date));
    const counts: { row: number; storeId: number; date: string; visitorCount: number }[] = [];
    const closedRows: { row: number; storeId: number; date: string; visitorCount: number }[] = [];

    for (const row of parsed.rows) {
      const store = storesByNr.get(row.storeNr);

      if (!store) {
        errors.push({ row: row.row, code: 'UNKNOWN_STORE' });
      } else if (closedMonths.has(row.date.slice(0, 7))) {
        closedRows.push({
          row: row.row,
          storeId: store.id,
          date: row.date,
          visitorCount: row.visitorCount,
        });
      } else {
        counts.push({
          row: row.row,
          storeId: store.id,
          date: row.date,
          visitorCount: row.visitorCount,
        });
      }
    }

    // A template covering a closed month carries its saved counts back unchanged; only a
    // count that would change a closed month is wrong.
    const closedSaved = await this.savedCounts(closedRows);
    const closedUnchanged = closedRows.filter(
      (row) => closedSaved.get(`${String(row.storeId)}|${row.date}`) === row.visitorCount,
    ).length;

    for (const row of closedRows) {
      if (closedSaved.get(`${String(row.storeId)}|${row.date}`) !== row.visitorCount) {
        errors.push({ row: row.row, code: 'CLOSED_PERIOD' });
      }
    }

    if (errors.length > 0) {
      errors.sort((a, b) => a.row - b.row);

      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_IMPORT_INVALID',
        `${String(errors.length)} row(s) are wrong; nothing was saved.`,
        { rows: errors.slice(0, MAX_REPORTED_ROW_ERRORS), errorCount: errors.length },
      );
    }

    if (counts.length === 0 && closedUnchanged === 0) {
      throw storeVisitorCountBadRequest(
        'STORE_VISITOR_COUNT_IMPORT_EMPTY',
        'The file has no row with a visitor count.',
      );
    }

    if (counts.length === 0) {
      return { created: 0, updated: 0, unchanged: closedUnchanged, skipped: parsed.skipped };
    }

    return this.dataSource.transaction(async (manager) => {
      const dates = counts.map((count) => count.date).sort();
      const existing = await manager.getRepository(StoreVisitorCountEntity).find({
        where: {
          storeId: In([...new Set(counts.map((count) => count.storeId))]),
          visitDate: Between(dates[0] ?? '', dates.at(-1) ?? ''),
        },
        lock: { mode: 'pessimistic_write' },
      });
      const existingByKey = new Map(
        existing.map((row) => [`${String(row.storeId)}|${row.visitDate}`, row]),
      );
      const inserts: Pick<StoreVisitorCountEntity, 'storeId' | 'visitDate' | 'visitorCount'>[] = [];
      // New number -> ids of the rows getting it; one audited update per distinct number.
      const updates = new Map<number, string[]>();
      let unchanged = closedUnchanged;

      for (const count of counts) {
        const row = existingByKey.get(`${String(count.storeId)}|${count.date}`);

        if (!row) {
          inserts.push({
            storeId: count.storeId,
            visitDate: count.date,
            visitorCount: count.visitorCount,
          });
        } else if (row.visitorCount === count.visitorCount) {
          unchanged += 1;
        } else {
          updates.set(count.visitorCount, [...(updates.get(count.visitorCount) ?? []), row.id]);
        }
      }

      if (inserts.length > 0) {
        await this.audit.insertMany(manager, StoreVisitorCountEntity, inserts, {
          context: IMPORT_CONTEXT,
        });
      }

      let updated = 0;

      for (const [visitorCount, ids] of updates) {
        for (let start = 0; start < ids.length; start += IDS_PER_UPDATE) {
          const result = await this.audit.update(
            manager,
            StoreVisitorCountEntity,
            { id: In(ids.slice(start, start + IDS_PER_UPDATE)) },
            { visitorCount },
            { context: IMPORT_CONTEXT },
          );

          updated += result.changedIds.length;
        }
      }

      return { created: inserts.length, updated, unchanged, skipped: parsed.skipped };
    });
  }

  async remove(id: string): Promise<void> {
    const row = await this.countRepository.findOneBy({ id });

    if (!row) {
      throw new NotFoundException('Visitor count not found.');
    }

    await this.assertMonthOpen(row.visitDate);
    await this.audit.delete(this.dataSource.manager, StoreVisitorCountEntity, { id: row.id });
  }

  private async replaceCount(
    id: string,
    visitorCount: number,
    store: StoreEntity,
  ): Promise<StoreVisitorCountResponse> {
    await this.audit.update(
      this.dataSource.manager,
      StoreVisitorCountEntity,
      { id },
      { visitorCount },
    );

    return toStoreVisitorCountResponse(await this.countRepository.findOneByOrFail({ id }), store);
  }

  /** A closed KPI month is frozen (ADR-041); its counts can no longer change. */
  private async assertMonthOpen(date: string): Promise<void> {
    const period = await this.periodRepository.findOneBy(visitMonth(date));

    if (period && !isPeriodOpen(period)) {
      throw kpiPeriodClosed(periodLabel(period));
    }
  }

  private firmStores(): Promise<StoreEntity[]> {
    return this.storeRepository.find({
      where: { firmNr: getFirmNumber() },
      order: { nr: 'ASC' },
    });
  }

  /** Saved counts of the given store-days, keyed `storeId|date`. */
  private async savedCounts(
    keys: readonly { storeId: number; date: string }[],
  ): Promise<Map<string, number>> {
    if (keys.length === 0) {
      return new Map();
    }

    const dates = keys.map((key) => key.date).sort();
    const rows = await this.countRepository.findBy({
      storeId: In([...new Set(keys.map((key) => key.storeId))]),
      visitDate: Between(dates[0] ?? '', dates.at(-1) ?? ''),
    });

    return new Map(
      rows.map((row) => [`${String(row.storeId)}|${row.visitDate}`, row.visitorCount]),
    );
  }

  /** `YYYY-MM` of the given days whose KPI period is closed (ADR-041). */
  private async closedMonths(dates: readonly string[]): Promise<Set<string>> {
    const months = [...new Set(dates.map((date) => date.slice(0, 7)))].map((month) =>
      visitMonth(`${month}-01`),
    );

    if (months.length === 0) {
      return new Set();
    }

    const periods = await this.periodRepository.find({ where: months });

    return new Set(periods.filter((period) => !isPeriodOpen(period)).map(periodLabel));
  }

  private async loadStores(ids: number[]): Promise<Map<number, StoreEntity>> {
    const unique = [...new Set(ids)];

    if (unique.length === 0) {
      return new Map();
    }

    const stores = await this.storeRepository.findBy({ id: In(unique) });

    return new Map(stores.map((store) => [store.id, store]));
  }
}
