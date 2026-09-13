import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

import type { AuthenticatedRequest } from './auth.types.js';

@Injectable()
export class FullAccessGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.employee?.fullAccess) {
      throw new ForbiddenException('Full access is required.');
    }

    return true;
  }
}
