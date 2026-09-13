import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';

import { formatTurkmenPhoneNumber } from '../../common/phone.js';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

const normalisePhone = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? formatTurkmenPhoneNumber(value) : value;

export class UpdateEmployeeDto {
  @ApiPropertyOptional({ type: String, example: 'ayse.yilmaz', minLength: 3, maxLength: 100 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({
    type: String,
    description: 'Yönetici tarafından zorla parola sıfırlama; çalışanın kendi parolasını '
      + 'değiştirmesi için PATCH /auth/password kullanılır.',
    minLength: 6,
    maxLength: 128,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(128)
  password?: string;

  @ApiPropertyOptional({ type: String, example: 'Ayşe', minLength: 1, maxLength: 100 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstname?: string;

  @ApiPropertyOptional({ type: String, example: 'Yılmaz', minLength: 1, maxLength: 100 })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastname?: string;

  @ApiPropertyOptional({
    type: String,
    example: 'ayse.yilmaz@example.com',
    maxLength: 320,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @Transform(trim)
  @IsEmail()
  @MaxLength(320)
  email?: string | null;

  @ApiPropertyOptional({ type: String, example: '+993 12 345678', maxLength: 32, nullable: true })
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @Transform(normalisePhone)
  @IsString()
  @MaxLength(32)
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    type: Number,
    description: 'Logo Tiger LOGICALREF external reference; foreign key değildir.',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @IsInt()
  @Min(1)
  erpEmployeeId?: number | null;

  @ApiPropertyOptional({
    type: String,
    description: 'Önceden POST /files ile yüklenmiş dosyanın id\'si; null gönderilirse avatar kaldırılır.',
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @Matches(GUID_PATTERN, { message: 'avatarId must be a GUID' })
  avatarId?: string | null;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'true ise employees ve dosya upload/silme gibi yönetimsel endpoint'
      + "'lere erişebilir.",
  })
  @IsOptional()
  @IsBoolean()
  fullAccess?: boolean;

  @ApiPropertyOptional({
    type: Boolean,
    description: 'false yapmak hesabı devre dışı bırakır; kalıcı silme için DELETE /employees/:id kullanılır.',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
