import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ type: String, example: 'admin', minLength: 1, maxLength: 100 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  username: string;

  @ApiProperty({ type: String, example: 'admin', minLength: 1, maxLength: 128 })
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;

  @ApiProperty({
    type: String,
    description: 'İstemci tarafından üretilen opak cihaz kimliği (UUID v4).',
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4')
  deviceId: string;

  @ApiPropertyOptional({ type: String, example: 'iPhone 15 — Ayşe', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  deviceName?: string;

  @ApiPropertyOptional({
    type: Boolean,
    default: false,
    description:
      'true ise refresh oturumu REFRESH_TOKEN_TTL (varsayılan 30 gün) kadar sürer; aksi hâlde SHORT_SESSION_TTL (varsayılan 20 dakika) kullanılır.',
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
