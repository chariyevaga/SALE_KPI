import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListErpEmployeesQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Tiger personel kodunda ve adında arar; büyük/küçük harf ve aksan duyarsızdır. Boşlukla ayrılan her kelime eşleşmelidir.',
    example: 'ayse',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;
}
