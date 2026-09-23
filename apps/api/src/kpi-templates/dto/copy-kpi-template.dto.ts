import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CopyKpiTemplateDto {
  @ApiPropertyOptional({
    type: String,
    maxLength: 200,
    example: 'MÜDÜR KPI 02',
    description:
      'Kopyanın adı. Verilmezse kaynağın adına bir sonraki boş " (n)" eki getirilir (ör. `MÜDÜR KPI 01 (2)`).',
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;
}
