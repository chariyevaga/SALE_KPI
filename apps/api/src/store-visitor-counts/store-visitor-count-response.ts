import { ApiProperty } from '@nestjs/swagger';

import type { StoreEntity } from '../stores/entities/store.entity.js';
import type { StoreVisitorCountEntity } from './entities/store-visitor-count.entity.js';
import {
  STORE_VISITOR_COUNT_ERROR_CODES,
  type StoreVisitorCountErrorCode,
} from './store-visitor-count-errors.js';

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
