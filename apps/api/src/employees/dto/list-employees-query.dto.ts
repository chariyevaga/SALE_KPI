import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const EMPLOYEE_SORT_FIELDS = [
  'firstname',
  'lastname',
  'username',
  'email',
  'createdAt',
] as const;

export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

const toOptionalBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};

export class ListEmployeesQueryDto {
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

  @ApiPropertyOptional({
    type: String,
    description:
      'Ad, soyad, kullanıcı adı, e-posta ve telefonda arar; büyük/küçük harf ve aksan duyarsızdır.',
    maxLength: 100,
  })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ type: Boolean, description: 'true: yalnızca aktif, false: yalnızca pasif.' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'true: yalnızca yöneticiler.' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  fullAccess?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'true: ERP personeline bağlı olanlar.' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hasErpLink?: boolean;

  @ApiPropertyOptional({ type: Boolean, description: 'true: profil fotoğrafı olanlar.' })
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  hasAvatar?: boolean;

  @ApiPropertyOptional({ enum: EMPLOYEE_SORT_FIELDS, default: 'firstname' })
  @IsOptional()
  @IsIn(EMPLOYEE_SORT_FIELDS)
  sort?: EmployeeSortField;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'asc' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase() : value,
  )
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';
}
