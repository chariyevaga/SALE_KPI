import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  type PipeTransform,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { AuditLogListResponse, RecordInfoResponse } from './audit-log-response.js';
import { AuditLogsService } from './audit-logs.service.js';
import { ListAuditLogsQueryDto, TABLE_NAME_PATTERN } from './dto/list-audit-logs-query.dto.js';

class ParseTableNamePipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (!TABLE_NAME_PATTERN.test(value)) {
      throw new BadRequestException('tableName must be a lower-case table name');
    }

    return value;
  }
}

@ApiTags('audit')
@ApiBearerAuth('access-token')
@Controller()
@UseGuards(AccessTokenGuard, FullAccessGuard)
export class AuditLogsController {
  constructor(@Inject(AuditLogsService) private readonly auditLogsService: AuditLogsService) {}

  @Get('audit-logs')
  @ApiOperation({
    summary: 'Kayıt değişiklik geçmişini yeniden eskiye, sayfalı listeler (yalnız full_access).',
    description:
      'Bir kaydın geçmişi için `tableName` + `recordId`, bir çalışanın yaptıkları için `actorId` verilir. Her satır tek bir kaydın tek bir değişikliğidir (ADR-036).',
  })
  @ApiOkResponse({ type: AuditLogListResponse })
  list(@Query() query: ListAuditLogsQueryDto): Promise<AuditLogListResponse> {
    return this.auditLogsService.list(query);
  }

  @Get('record-info/:tableName/:recordId')
  @ApiOperation({
    summary:
      'Kaydı kimin, ne zaman oluşturduğunu ve son değiştirdiğini döner (yalnız full_access).',
    description:
      'Kayıt izi tutulan her tablo için çalışır. `createdBy`/`updatedBy` `null` ise değişikliği sistem yapmıştır ya da kayıt, izleme başlamadan önce oluşmuştur.',
  })
  @ApiParam({ name: 'tableName', type: String, example: 'employees' })
  @ApiParam({ name: 'recordId', type: String, format: 'uuid' })
  @ApiOkResponse({ type: RecordInfoResponse })
  @ApiNotFoundResponse({ description: 'Tablo kayıt izi tutulan bir tablo değil ya da kayıt yok.' })
  getRecordInfo(
    @Param('tableName', new ParseTableNamePipe()) tableName: string,
    @Param('recordId', new ParseUUIDPipe()) recordId: string,
  ): Promise<RecordInfoResponse> {
    return this.auditLogsService.getRecordInfo(tableName, recordId);
  }
}
