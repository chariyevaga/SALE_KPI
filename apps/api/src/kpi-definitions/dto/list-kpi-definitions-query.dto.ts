import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListKpiDefinitionsQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'KPI kodunda ve adın dört dildeki (tr/en/ru/tk) değerlerinde arar; büyük/küçük harf ve aksan duyarsızdır. Boşlukla ayrılan her kelime eşleşmelidir.',
    example: 'magaza ciro',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;
}
