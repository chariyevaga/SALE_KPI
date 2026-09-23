import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from '../auth/auth.types.js';

/**
 * Daily visitor counts are read and written by employees flagged for it and by
 * administrators (ADR-043, updated 2026-09-23); everyone else is refused.
 */
@Injectable()
export class VisitorCountAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.employee?.canEnterVisitorCounts && !request.employee?.fullAccess) {
      throw new ForbiddenException('Visitor counts are not available to this employee.');
    }

    return true;
  }
}
