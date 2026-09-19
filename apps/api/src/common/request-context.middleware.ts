import { randomUUID } from 'node:crypto';

import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

import { runWithRequestContext } from './request-context.js';

/**
 * Opens the request context for everything downstream (guards, handlers, services). It is
 * registered through Nest's MiddlewareConsumer, which runs after the body parsers; mounted
 * before them the context would be lost in their stream callbacks.
 */
@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: Request, _response: Response, next: NextFunction): void {
    runWithRequestContext(
      { requestId: randomUUID(), actorId: null, ipAddress: request.ip ?? null },
      next,
    );
  }
}
