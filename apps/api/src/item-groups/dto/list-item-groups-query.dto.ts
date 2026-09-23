import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ListItemGroupsQueryDto {
  @ApiPropertyOptional({
    type: String,
    description:
      'Grup kodunda arar; büyük/küçük harf ve aksan duyarsızdır. Boşlukla ayrılan her kelime eşleşmelidir.',
    example: 'sumka',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;
}
