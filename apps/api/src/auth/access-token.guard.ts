import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';

import { AuthService } from './auth.service.js';
import type { AuthenticatedRequest } from './auth.types.js';
import { TokenService } from './token.service.js';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    @Inject(AuthService) private readonly authService: AuthService,
    @Inject(TokenService) private readonly tokenService: TokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;

    if (!authorization?.startsWith('Bearer ')) {
      throw new UnauthorizedException('A bearer access token is required.');
    }

    const payload = this.tokenService.verifyAccessToken(authorization.slice(7));
    request.employee = await this.authService.getActiveEmployee(payload.sub);
    request.accessTokenPayload = payload;

    return true;
  }
}
