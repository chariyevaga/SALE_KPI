import { ApiProperty } from '@nestjs/swagger';
import type { Request } from 'express';

import type { EmployeeEntity } from '../employees/entities/employee.entity.js';
import { EmployeeResponse } from '../employees/employee-response.js';
import type { AccessTokenPayload } from './token.service.js';

export class AuthResponse {
  @ApiProperty({
    type: String,
    description: 'Authorization: Bearer başlığında gönderilecek kısa ömürlü token.',
  })
  accessToken: string;

  @ApiProperty({ type: String, format: 'date-time' })
  accessTokenExpiresAt: string;

  @ApiProperty({ type: () => EmployeeResponse })
  employee: EmployeeResponse;

  @ApiProperty({ type: String, description: 'POST /auth/refresh çağrısında kullanılacak token.' })
  refreshToken: string;

  @ApiProperty({ type: String, format: 'date-time' })
  refreshTokenExpiresAt: string;
}

export class DeviceSessionResponse {
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, description: 'İstemci tarafından üretilen opak cihaz kimliği.' })
  deviceId: string;

  @ApiProperty({ type: String, nullable: true })
  deviceName: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt: string;

  @ApiProperty({
    type: String,
    format: 'uuid',
    description: 'DELETE /auth/devices/:id çağrısında kullanılan oturum kimliği.',
  })
  id: string;

  @ApiProperty({ type: String, nullable: true })
  ipAddress: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  lastSeenAt: string;

  @ApiProperty({
    type: Boolean,
    description: 'true ise uzun ömürlü ("beni hatırla") oturum; false ise kısa oturum.',
  })
  rememberMe: boolean;
}

export interface AuthenticatedRequest extends Request {
  accessTokenPayload: AccessTokenPayload;
  employee: EmployeeEntity;
}
