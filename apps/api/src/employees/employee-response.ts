import { ApiProperty } from '@nestjs/swagger';

import type { EmployeeEntity } from './entities/employee.entity.js';

export class EmployeeAvatarResponse {
  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  bigImageUrl: string | null;

  @ApiProperty({ type: String, nullable: true })
  blurhash: string | null;

  @ApiProperty({ type: String, format: 'uri' })
  contentUrl: string;

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  mediumImageUrl: string | null;

  @ApiProperty({ type: String, nullable: true, format: 'uri' })
  smallImageUrl: string | null;
}

export class EmployeeResponse {
  @ApiProperty({ type: () => EmployeeAvatarResponse, nullable: true })
  avatar: EmployeeAvatarResponse | null;

  @ApiProperty({
    type: Boolean,
    description: 'true ise mağazaların günlük ziyaretçi sayısını girebilir (ADR-043).',
  })
  canEnterVisitorCounts: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: string;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ type: Number, nullable: true })
  erpEmployeeId: number | null;

  @ApiProperty({
    type: String,
    nullable: true,
    description: 'erp_employees.code karşılığı; ERP bağlantısı yoksa null.',
  })
  erpEmployeeCode: string | null;

  @ApiProperty({ type: String })
  firstname: string;

  @ApiProperty({ type: Boolean, description: 'true ise yönetimsel endpoint\'lere erişebilir.' })
  fullAccess: boolean;

  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: Boolean })
  isActive: boolean;

  @ApiProperty({ type: String })
  lastname: string;

  @ApiProperty({ type: String, nullable: true })
  phoneNumber: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: string;

  @ApiProperty({ type: String })
  username: string;
}

export interface EmployeeResponseOptions {
  /** Contact details are visible to admins and to the employee themselves only. */
  includeContact: boolean;
  /** Resolved from the erp_employees view; the raw id is an internal reference. */
  erpEmployeeCode?: string | null;
}

export function toEmployeeResponse(
  employee: EmployeeEntity,
  options: EmployeeResponseOptions = { includeContact: true },
): EmployeeResponse {
  const avatar = employee.avatar;

  return {
    avatar: avatar
      ? {
          bigImageUrl: avatar.bigImage
            ? `/files/${avatar.id}/content?variant=big`
            : null,
          blurhash: avatar.blurhash,
          contentUrl: `/files/${avatar.id}/content?variant=original`,
          id: avatar.id,
          mediumImageUrl: avatar.mediumImage
            ? `/files/${avatar.id}/content?variant=medium`
            : null,
          smallImageUrl: avatar.smallImage
            ? `/files/${avatar.id}/content?variant=small`
            : null,
        }
      : null,
    canEnterVisitorCounts: employee.canEnterVisitorCounts,
    createdAt: employee.createdAt.toISOString(),
    email: options.includeContact ? employee.email : null,
    erpEmployeeCode: options.erpEmployeeCode ?? null,
    erpEmployeeId: employee.erpEmployeeId,
    firstname: employee.firstname,
    fullAccess: employee.fullAccess,
    id: employee.id,
    isActive: employee.isActive,
    lastname: employee.lastname,
    phoneNumber: options.includeContact ? employee.phoneNumber : null,
    updatedAt: employee.updatedAt.toISOString(),
    username: employee.username,
  };
}
