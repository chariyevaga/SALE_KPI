import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import type { StoreEntity } from '../stores/entities/store.entity.js';
import type { StoreVisitorCountEntity } from './entities/store-visitor-count.entity.js';
import {
  STORE_VISITOR_COUNT_ERROR_CODES,
  type StoreVisitorCountErrorCode,
} from './store-visitor-count-errors.js';
import {
  IMPORT_ROW_ERROR_CODES,
  type ImportRowErrorCode,
  MAX_REPORTED_ROW_ERRORS,
} from './visitor-count-import-rules.js';

export class StoreVisitorCountResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Number, example: 6, description: 'Tiger L_CAPIDIV LOGICALREF.' })
  storeId: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 2,
    description: 'Tiger iş yeri numarası; mağaza Tiger’da artık yoksa `null`.',
  })
  storeNr: number | null;

  @ApiProperty({ type: String, nullable: true, example: 'Merkez Mağaza' })
  storeName: string | null;

  @ApiProperty({ type: String, format: 'date', example: '2026-09-21' })
  date: string;

  @ApiProperty({ type: Number, example: 184 })
  visitorCount: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class StoreVisitorCountListResponse {
  @ApiProperty({ type: () => StoreVisitorCountResponse, isArray: true })
  items: StoreVisitorCountResponse[];

  @ApiProperty({ type: Number })
  total: number;

  @ApiProperty({ type: Number })
  page: number;

  @ApiProperty({ type: Number })
  limit: number;
}

export class StoreVisitorCountErrorResponse {
  @ApiProperty({ type: Number, example: 400 })
  statusCode: number;

  @ApiProperty({ type: String, example: 'Bad Request' })
  error: string;

  @ApiProperty({ type: String, example: 'date is in the future.' })
  message: string;

  @ApiProperty({ type: String, enum: STORE_VISITOR_COUNT_ERROR_CODES })
  code: StoreVisitorCountErrorCode;
}

export function toStoreVisitorCountResponse(
  row: StoreVisitorCountEntity,
  store: StoreEntity | undefined,
): StoreVisitorCountResponse {
  return {
    id: row.id,
    storeId: row.storeId,
    storeNr: store?.nr ?? null,
    storeName: store?.name ?? null,
    date: row.visitDate,
    visitorCount: row.visitorCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** What an Excel import wrote (ADR-055). */
export class StoreVisitorCountImportResponse {
  @ApiProperty({ type: Number, example: 12, description: 'Yeni eklenen gün sayımları.' })
  created: number;

  @ApiProperty({
    type: Number,
    example: 3,
    description: 'Sayısı değişen mevcut sayımlar (eskisinin yerine geçti, kayıt izine yazıldı).',
  })
  updated: number;

  @ApiProperty({ type: Number, example: 40, description: 'Aynı sayıyla zaten kayıtlı olanlar.' })
  unchanged: number;

  @ApiProperty({
    type: Number,
    example: 5,
    description: 'Sayı sütunu boş bırakıldığı için okunmayan satırlar.',
  })
  skipped: number;
}

export class StoreVisitorCountImportRowError {
  @ApiProperty({ type: Number, example: 7, description: 'Excel satır numarası (başlık 1).' })
  row: number;

  @ApiProperty({ type: String, enum: IMPORT_ROW_ERROR_CODES })
  code: ImportRowErrorCode;
}

export class StoreVisitorCountImportErrorResponse extends StoreVisitorCountErrorResponse {
  @ApiPropertyOptional({
    type: () => StoreVisitorCountImportRowError,
    isArray: true,
    description: `Hatalı satırlar, satır sırasıyla; en çok ${String(MAX_REPORTED_ROW_ERRORS)} tanesi. Yalnız \`STORE_VISITOR_COUNT_IMPORT_INVALID\` ile gelir.`,
  })
  rows?: StoreVisitorCountImportRowError[];

  @ApiPropertyOptional({ type: Number, description: 'Hatalı satırların toplamı.' })
  errorCount?: number;
}

export class VisitorCountReportPeriod {
  @ApiProperty({ type: String, format: 'date' })
  from: string;

  @ApiProperty({ type: String, format: 'date' })
  to: string;

  @ApiProperty({ type: Number, description: 'Girilen sayıların toplamı.' })
  visitors: number;

  @ApiProperty({ type: Number, description: 'Sayı girilmiş mağaza-gün.' })
  countedStoreDays: number;

  @ApiProperty({
    type: Number,
    description: 'Girilebilecek mağaza-gün: geçmiş günler; bugün yalnız girildiyse.',
  })
  possibleStoreDays: number;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Girilen mağaza-gün başına ortalama kişi.',
  })
  average: number | null;
}

export class VisitorCountReportDay {
  @ApiProperty({ type: String, format: 'date' })
  date: string;

  @ApiProperty({ type: Number, nullable: true, description: 'Hiç girilmediyse `null`.' })
  visitors: number | null;

  @ApiProperty({ type: Number, description: 'O gün sayısı girilen mağaza.' })
  stores: number;
}

export class VisitorCountReportWeekday {
  @ApiProperty({ type: Number, minimum: 1, maximum: 7, description: 'ISO: 1 pazartesi.' })
  weekday: number;

  @ApiProperty({ type: Number, nullable: true })
  average: number | null;

  @ApiProperty({ type: Number })
  storeDays: number;
}

export class VisitorCountReportStore {
  @ApiProperty({ type: Number })
  storeId: number;

  @ApiProperty({ type: Number })
  storeNr: number;

  @ApiProperty({ type: String, nullable: true })
  storeName: string | null;

  @ApiProperty({ type: Number })
  visitors: number;

  @ApiProperty({ type: Number, description: 'Aralıkta sayısı girilen gün.' })
  days: number;

  @ApiProperty({ type: Number, nullable: true })
  average: number | null;
}

export class VisitorCountReportBusiestDay {
  @ApiProperty({ type: String, format: 'date' })
  date: string;

  @ApiProperty({ type: Number })
  visitors: number;
}

/** Visitor count report of a date range (ADR-056). */
export class VisitorCountReportResponse {
  @ApiProperty({ type: () => VisitorCountReportPeriod })
  current: VisitorCountReportPeriod;

  @ApiProperty({
    type: () => VisitorCountReportPeriod,
    description: 'Hemen önceki aynı uzunluktaki aralık.',
  })
  previous: VisitorCountReportPeriod;

  @ApiProperty({
    type: Number,
    nullable: true,
    description: 'Mağaza-gün ortalamasının önceki aralığa göre değişimi (%).',
  })
  averageChange: number | null;

  @ApiProperty({ type: Number, description: 'Rapordaki mağaza sayısı.' })
  storeCount: number;

  @ApiProperty({ type: () => VisitorCountReportBusiestDay, nullable: true })
  busiestDay: VisitorCountReportBusiestDay | null;

  @ApiProperty({ type: () => VisitorCountReportDay, isArray: true })
  days: VisitorCountReportDay[];

  @ApiProperty({ type: () => VisitorCountReportWeekday, isArray: true })
  weekdays: VisitorCountReportWeekday[];

  @ApiProperty({
    type: () => VisitorCountReportStore,
    isArray: true,
    description: 'Toplama göre büyükten küçüğe; hiç girilmeyen mağaza da vardır.',
  })
  stores: VisitorCountReportStore[];
}
