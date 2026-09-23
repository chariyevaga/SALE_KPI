import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description:
      'Dönem. Verilmezse içinde bulunulan ayın dönemi, onda plan yoksa planı olan en yeni dönem.',
  })
  @IsOptional()
  @Matches(GUID_PATTERN, { message: 'periodId must be a GUID' })
  periodId?: string;

  @ApiPropertyOptional({
    type: String,
    format: 'uuid',
    description: 'Yalnız bu şablondan gelen planlar sıralanır (ör. yalnız satış personeli).',
  })
  @IsOptional()
  @Matches(GUID_PATTERN, { message: 'templateId must be a GUID' })
  templateId?: string;
}
