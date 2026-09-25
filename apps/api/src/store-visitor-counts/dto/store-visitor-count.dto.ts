import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsISO8601, IsOptional, Matches, Max, Min } from 'class-validator';

import { MAX_VISITOR_COUNT } from '../store-visitor-count-rules.js';
import { MAX_TEMPLATE_DAYS } from '../visitor-count-import-rules.js';
import { MAX_REPORT_DAYS } from '../visitor-count-report-rules.js';
import { TEMPLATE_LANGUAGES, type TemplateLanguage } from '../visitor-count-template.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MESSAGE = 'must be a date in YYYY-MM-DD format';

export class SaveStoreVisitorCountDto {
  @ApiProperty({
    type: Number,
    example: 6,
    description: 'Mağaza (`GET /stores` yanıtındaki `id`, Tiger L_CAPIDIV LOGICALREF).',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId: number;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-09-21',
    description: 'Sayımın günü; gelecekteki bir gün olamaz.',
  })
  @Matches(DATE_PATTERN, { message: `date ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `date ${DATE_MESSAGE}` })
  date: string;

  @ApiProperty({
    type: Number,
    example: 184,
    minimum: 0,
    maximum: MAX_VISITOR_COUNT,
    description: 'O gün mağazaya giren kişi sayısı.',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(MAX_VISITOR_COUNT)
  visitorCount: number;
}

export class ListStoreVisitorCountsQueryDto {
  @ApiPropertyOptional({ type: Number, default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ type: Number, default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ type: Number, description: 'Yalnız bu mağazanın sayımları.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Bu günden itibaren.' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: `from ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `from ${DATE_MESSAGE}` })
  from?: string;

  @ApiPropertyOptional({ type: String, format: 'date', description: 'Bu güne kadar (dahil).' })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: `to ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `to ${DATE_MESSAGE}` })
  to?: string;
}

export class StoreVisitorCountTemplateQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: 'İlk gün; verilmezse dün (iş saat dilimi).',
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: `from ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `from ${DATE_MESSAGE}` })
  from?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'date',
    description: `Son gün (dahil); verilmezse \`from\`. Aralık en çok ${String(MAX_TEMPLATE_DAYS)} gün, bugünden ileri olamaz.`,
  })
  @IsOptional()
  @Matches(DATE_PATTERN, { message: `to ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `to ${DATE_MESSAGE}` })
  to?: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Yalnız bu mağaza; verilmezse firmanın bütün mağazaları.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;

  @ApiPropertyOptional({
    type: String,
    enum: TEMPLATE_LANGUAGES,
    default: 'tr',
    description: 'Sayfa adları, başlıklar ve açıklamanın dili.',
  })
  @IsOptional()
  @IsIn(TEMPLATE_LANGUAGES)
  lang?: TemplateLanguage;
}

export class StoreVisitorCountReportQueryDto {
  @ApiProperty({ type: String, format: 'date', example: '2026-09-01' })
  @Matches(DATE_PATTERN, { message: `from ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `from ${DATE_MESSAGE}` })
  from: string;

  @ApiProperty({
    type: String,
    format: 'date',
    example: '2026-09-25',
    description: `Son gün (dahil). Aralık en çok ${String(MAX_REPORT_DAYS)} gün, bugünden ileri olamaz.`,
  })
  @Matches(DATE_PATTERN, { message: `to ${DATE_MESSAGE}` })
  @IsISO8601({ strict: true }, { message: `to ${DATE_MESSAGE}` })
  to: string;

  @ApiPropertyOptional({
    type: Number,
    description: 'Yalnız bu mağaza; verilmezse firmanın bütün mağazaları.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  storeId?: number;
}
