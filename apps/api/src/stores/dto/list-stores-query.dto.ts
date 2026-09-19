import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListStoresQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Mağaza numarasında ve adında arar; büyük/küçük harf ve aksan duyarsızdır. Boşlukla ayrılan her kelime eşleşmelidir.',
    example: 'berkarar',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;
}
