import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MinLength } from 'class-validator';

export class RefreshDto {
  @ApiProperty({
    type: String,
    description: 'Login veya önceki refresh çağrısından alınan refresh token.',
  })
  @IsString()
  @MinLength(1)
  refreshToken: string;

  @ApiProperty({
    type: String,
    description: 'Login isteğinde gönderilen aynı cihaz kimliği (UUID v4).',
    format: 'uuid',
    example: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  })
  @IsUUID('4')
  deviceId: string;
}
