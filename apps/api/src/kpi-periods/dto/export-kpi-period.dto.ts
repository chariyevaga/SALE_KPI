import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { ConfirmPasswordDto } from '../../auth/dto/confirm-password.dto.js';
import {
  TEMPLATE_LANGUAGES,
  type TemplateLanguage,
} from '../../store-visitor-counts/visitor-count-template.js';

/** Downloading a period's Excel file asks for the person's own password (ADR-059). */
export class ExportKpiPeriodDto extends ConfirmPasswordDto {
  @ApiPropertyOptional({
    type: String,
    enum: TEMPLATE_LANGUAGES,
    default: 'tr',
    description: 'Dosyanın dili (sayfa ve sütun adları, KPI adları).',
  })
  @IsOptional()
  @IsIn(TEMPLATE_LANGUAGES)
  lang?: TemplateLanguage;
}
