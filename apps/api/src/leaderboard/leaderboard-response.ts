import { ApiProperty } from '@nestjs/swagger';

import { KpiAssignmentPeriodResponse } from '../kpi-assignments/kpi-assignment-response.js';

export class LeaderboardEmployeeResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  firstname: string;

  @ApiProperty({ type: String })
  lastname: string;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '/files/0b4c…/content?variant=small',
    description: 'Küçük avatar; Bearer token ile okunur.',
  })
  avatarUrl: string | null;
}

export class LeaderboardEntryResponse {
  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1,
    description: 'Eşit puan aynı sırayı alır; hiç hesaplanmamış plan `null`.',
  })
  rank: number | null;

  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_assignments.id`' })
  assignmentId: string;

  @ApiProperty({ type: () => LeaderboardEmployeeResponse })
  employee: LeaderboardEmployeeResponse;

  @ApiProperty({ type: String, format: 'uuid' })
  templateId: string;

  @ApiProperty({ type: String, example: 'SATIŞ KPI 01' })
  templateName: string;

  @ApiProperty({ type: Number, nullable: true, example: 86.25, description: '0–100.' })
  totalScore: number | null;

  @ApiProperty({ type: Number, example: 4 })
  scoredItemCount: number;

  @ApiProperty({ type: Number, example: 5 })
  itemCount: number;

  @ApiProperty({ type: Boolean, description: 'Satır oturum sahibinin kendi planı.' })
  isMe: boolean;
}

export class LeaderboardTemplateResponse {
  @ApiProperty({ type: String, format: 'uuid' })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: Number, description: 'Dönemde bu şablondan gelen plan sayısı.' })
  planCount: number;
}

export class LeaderboardAutoCalculationResponse {
  @ApiProperty({ type: Number, example: 10, description: '0: otomatik hesaplama kapalı.' })
  intervalMinutes: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'API açıldığından beri son otomatik hesaplamanın bitişi.',
  })
  lastRunAt: Date | null;
}

export class LeaderboardResponse {
  @ApiProperty({
    type: () => KpiAssignmentPeriodResponse,
    nullable: true,
    description: 'Gösterilen dönem; hiç plan yoksa `null`.',
  })
  period: KpiAssignmentPeriodResponse | null;

  @ApiProperty({
    type: () => KpiAssignmentPeriodResponse,
    isArray: true,
    description: 'Planı olan bütün dönemler, yeniden eskiye.',
  })
  periods: KpiAssignmentPeriodResponse[];

  @ApiProperty({ type: () => LeaderboardTemplateResponse, isArray: true })
  templates: LeaderboardTemplateResponse[];

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Dönemdeki sonuçların en son yazıldığı an.',
  })
  calculatedAt: Date | null;

  @ApiProperty({ type: () => LeaderboardAutoCalculationResponse })
  autoCalculation: LeaderboardAutoCalculationResponse;

  @ApiProperty({ type: () => LeaderboardEntryResponse, isArray: true })
  entries: LeaderboardEntryResponse[];
}
