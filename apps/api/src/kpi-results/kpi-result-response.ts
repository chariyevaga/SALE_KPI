import { ApiProperty } from '@nestjs/swagger';

import { KpiTemplateDefinitionResponse } from '../kpi-templates/kpi-template-response.js';
import { SalaryPayoutResponse } from '../employee-salaries/salary-payout.js';
import { KPI_RESULT_SOURCES, type KpiResultSource } from './entities/kpi-result.entity.js';

export class KpiResultResponse {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_assignment_items.id`' })
  itemId: string;

  @ApiProperty({ type: () => KpiTemplateDefinitionResponse })
  definition: KpiTemplateDefinitionResponse;

  @ApiProperty({ type: Number, example: 40 })
  weight: number;

  @ApiProperty({ type: Number, nullable: true, example: 347621 })
  targetValue: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 289450.75,
    description: '`null`: Tiger verisi yok ya da elle girilmedi.',
  })
  actualValue: number | null;

  @ApiProperty({
    type: String,
    enum: KPI_RESULT_SOURCES,
    description: '`calculated`: Tiger’dan okundu, `manual`: elle girildi.',
  })
  source: KpiResultSource;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 145.2,
    description: 'Ham gerçekleşme; %100’ü aşabilir, iade fazlasında negatif olabilir.',
  })
  rawAchievement: number | null;

  @ApiProperty({ type: Number, nullable: true, example: 100, description: '0–100 arası.' })
  cappedAchievement: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 40,
    description: 'Ağırlıklı katkı: sınırlandırılmış gerçekleşme × ağırlık / 100.',
  })
  weightedScore: number | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  calculatedAt: Date | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 4284,
    description:
      'Bu KPI’ın maaştaki değeri: maaşın KPI kısmı × ağırlık / 100. O ay maaş yoksa `null` (ADR-049).',
  })
  salaryValue: number | null;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 1198.68,
    description:
      'Bu KPI’dan kazanılan: maaşın KPI kısmı × ağırlıklı katkı / 100. Puanlanmadıysa ya da maaş yoksa `null`.',
  })
  salaryEarned: number | null;
}

export class KpiPlanResultsResponse {
  @ApiProperty({ type: String, format: 'uuid', description: '`kpi_assignments.id`' })
  assignmentId: string;

  @ApiProperty({
    type: Number,
    nullable: true,
    example: 86.25,
    description: 'Planın toplam puanı; hiç hesaplanmadıysa `null`.',
  })
  totalScore: number | null;

  @ApiProperty({ type: Number, example: 4, description: 'Puanı hesaplanabilen satır sayısı.' })
  scoredItemCount: number;

  @ApiProperty({ type: Number, example: 5 })
  itemCount: number;

  @ApiProperty({
    type: String,
    format: 'date-time',
    nullable: true,
    description: 'Son hesaplama anı; ay içinde hesaplandıysa sonuç ara sonuçtur.',
  })
  calculatedAt: Date | null;

  @ApiProperty({ type: () => KpiResultResponse, isArray: true })
  items: KpiResultResponse[];

  @ApiProperty({
    type: () => SalaryPayoutResponse,
    nullable: true,
    description:
      'Planın ayında geçerli maaş ve kazanılan tutarlar. Bu uç yalnız planın sahibine ve `full_access`’e açık olduğu için maaşı da yalnız onlar görür; o ay maaş yoksa `null`.',
  })
  salary: SalaryPayoutResponse | null;
}

export class KpiPeriodCalculationResponse {
  @ApiProperty({ type: Number, example: 6, description: 'Hesaplanan plan sayısı.' })
  calculated: number;

  @ApiProperty({
    type: Number,
    example: 2,
    description: 'Puanı hâlâ eksik olan plan sayısı (hedefi ya da elle girişi olmayan satır).',
  })
  incomplete: number;

  @ApiProperty({ type: String, format: 'date-time' })
  calculatedAt: Date;
}
