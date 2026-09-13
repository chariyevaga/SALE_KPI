import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  Matches,
  ValidateIf,
} from 'class-validator';

import { GUID_PATTERN } from '../../common/guid.js';

/**
 * Self-service profile edits. Deliberately limited to the avatar: everything that
 * affects access or identity stays behind the admin-only employees endpoints.
 */
export class UpdateOwnProfileDto {
  @ApiPropertyOptional({
    type: String,
    description: "Önceden POST /files ile yüklenmiş dosyanın id'si; null gönderilirse avatar kaldırılır.",
    format: 'uuid',
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_object, value: unknown) => value !== null)
  @Matches(GUID_PATTERN, { message: 'avatarId must be a GUID' })
  avatarId?: string | null;
}
