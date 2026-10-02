import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class StoreDashboardQueryDto {
  @ApiPropertyOptional({
    type: Number,
    example: 2026,
    description:
      'Karşılaştırılan yıl; bir önceki yılla ay ay karşılaştırılır. Verilmezse içinde bulunulan yıl (`BUSINESS_TIME_ZONE`).',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(2100)
  year?: number;
}
