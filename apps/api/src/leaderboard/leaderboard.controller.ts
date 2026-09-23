import { Controller, Get, Inject, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import type { AuthenticatedRequest } from '../auth/auth.types.js';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto.js';
import { LeaderboardResponse } from './leaderboard-response.js';
import { LeaderboardService } from './leaderboard.service.js';

@ApiTags('leaderboard')
@ApiBearerAuth('access-token')
@Controller('leaderboard')
@UseGuards(AccessTokenGuard)
export class LeaderboardController {
  constructor(
    @Inject(LeaderboardService) private readonly leaderboardService: LeaderboardService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Dönemin planlarını toplam KPI puanına göre sıralar.',
    description:
      'Oturum açmış her kullanıcıya açıktır. Yalnız ad, avatar, şablon adı ve toplam puan döner; hedef ve gerçekleşen değerler dönmez. Puanlar saklanmış sonuçlardır (ADR-041); açık dönemler `KPI_AUTO_CALCULATION_INTERVAL_MINUTES` aralığıyla yeniden hesaplanır (ADR-047).',
  })
  @ApiOkResponse({ type: LeaderboardResponse })
  @ApiNotFoundResponse({ description: '`periodId` bulunamadı ya da dönemde plan yok.' })
  get(
    @Query() query: LeaderboardQueryDto,
    @Req() request: AuthenticatedRequest,
  ): Promise<LeaderboardResponse> {
    return this.leaderboardService.get(query, request.employee.id);
  }
}
