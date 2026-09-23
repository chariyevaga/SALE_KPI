import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Matches, Max, Min } from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';

export const TABLE_NAME_PATTERN = /^[a-z][a-z0-9_]{0,127}$/;

export class ListAuditLogsQueryDto {
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

  @ApiPropertyOptional({ type: String, example: 'employees', description: 'Tablo adı (dbo).' })
  @IsOptional()
  @Matches(TABLE_NAME_PATTERN, { message: 'tableName must be a lower-case table name' })
  tableName?: string;

  @ApiPropertyOptional({ type: String, format: 'uuid', description: 'Kaydın id değeri.' })
  @IsOptional()
  @Matches(GUID_PATTERN, { message: 'recordId must be a GUID' })
  recordId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Yalnız bu çalışanın yaptığı değişiklikler.',
  })
  @IsOptional()
  @Matches(GUID_PATTERN, { message: 'actorId must be a GUID' })
  actorId?: string;
}
