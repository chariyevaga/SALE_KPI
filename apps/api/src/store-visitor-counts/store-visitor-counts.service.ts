import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { AuditService } from '../audit/audit.service.js';
import { getFirmNumber } from '../config/environment.js';
import { KpiPeriodEntity } from '../kpi-periods/entities/kpi-period.entity.js';
import { kpiPeriodClosed } from '../kpi-periods/kpi-period-errors.js';
import { isPeriodOpen, periodLabel } from '../kpi-periods/kpi-period-rules.js';
import { StoreEntity } from '../stores/entities/store.entity.js';
import type {
  ListStoreVisitorCountsQueryDto,
  SaveStoreVisitorCountDto,
} from './dto/store-visitor-count.dto.js';
import { StoreVisitorCountEntity } from './entities/store-visitor-count.entity.js';
import { storeVisitorCountBadRequest } from './store-visitor-count-errors.js';
import {
  type StoreVisitorCountListResponse,
  type StoreVisitorCountResponse,
  toStoreVisitorCountResponse,
} from './store-visitor-count-response.js';
import { isFutureVisitDate, visitMonth } from './store-visitor-count-rules.js';

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

  private async loadStores(ids: number[]): Promise<Map<number, StoreEntity>> {
    const unique = [...new Set(ids)];

    if (unique.length === 0) {
      return new Map();
    }

    const stores = await this.storeRepository.findBy({ id: In(unique) });

    return new Map(stores.map((store) => [store.id, store]));
  }
}
