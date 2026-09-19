import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  Matches,
} from 'class-validator';

import { GUID_PATTERN } from '../guid.js';

export const BULK_MAX_IDS = 100;

/** Lower-cases ids so duplicates that differ only in GUID letter case are rejected too. */
const toLowerCaseIds = ({ value }: { value: unknown }): unknown =>
  Array.isArray(value)
    ? value.map((id: unknown) => (typeof id === 'string' ? id.toLowerCase() : id))
    : value;

/** Selection sent by list screens for bulk actions (ADR-035). */
export class BulkIdsDto {
  @ApiProperty({
    type: String,
    format: 'uuid',
    isArray: true,
    minItems: 1,
    maxItems: BULK_MAX_IDS,
    description: `Seçilen kayıtların id'leri; 1–${BULK_MAX_IDS} arası, tekrarsız.`,
  })
  @Transform(toLowerCaseIds)
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(BULK_MAX_IDS)
  @ArrayUnique()
  @Matches(GUID_PATTERN, { each: true, message: 'each value in ids must be a GUID' })
  ids: string[];
}

export class BulkStatusDto extends BulkIdsDto {
  @ApiProperty({ type: Boolean, description: '`true` aktifleştirir, `false` pasifleştirir.' })
  @IsBoolean()
  isActive: boolean;
}

export class BulkUpdateResponse {
  @ApiProperty({
    type: Number,
    example: 3,
    description:
      "Durumu gerçekten değişen kayıt sayısı. Zaten istenen durumda olanlar ve bulunamayan id'ler sayılmaz.",
  })
  updated: number;
}
