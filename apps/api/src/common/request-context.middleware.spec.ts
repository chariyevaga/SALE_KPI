import assert from 'node:assert/strict';
import { test } from 'node:test';

import 'reflect-metadata';
import {
  type CanActivate,
  Controller,
  Get,
  Injectable,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
  UseGuards,
  type ExecutionContext,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import type { Request } from 'express';

import { getRequestContext, setRequestActor } from './request-context.js';
import { RequestContextMiddleware } from './request-context.middleware.js';

/** Stands in for AccessTokenGuard: identifies the caller asynchronously, then sets the actor. */
@Injectable()
class FakeAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    await new Promise((resolve) => setTimeout(resolve, 5));
    setRequestActor(request.header('x-actor') ?? null);
    return true;
  }
}

@Controller()
class ProbeController {
  @Get('probe')
  @UseGuards(FakeAuthGuard)
  async probe(): Promise<unknown> {
    // Services run after more awaits; the context must survive them.
    await new Promise((resolve) => setTimeout(resolve, 5));
    return getRequestContext() ?? null;
  }
}

@Module({ controllers: [ProbeController], providers: [FakeAuthGuard] })
class ProbeModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware)
      .forRoutes({ path: '{*path}', method: RequestMethod.ALL });
  }
}

void test('each request carries its own context from the guard to the handler', async () => {
  const app = await NestFactory.create(ProbeModule, { logger: false });
  await app.listen(0, '127.0.0.1');

  try {
    const base = await app.getUrl();
    const [first, second, anonymous] = (await Promise.all([
      fetch(`${base}/probe`, { headers: { 'x-actor': 'employee-1' } }).then((r) => r.json()),
      fetch(`${base}/probe`, { headers: { 'x-actor': 'employee-2' } }).then((r) => r.json()),
      fetch(`${base}/probe`).then((r) => r.json()),
    ])) as Array<{ actorId: string | null; requestId: string; ipAddress: string | null }>;

    assert.equal(first?.actorId, 'employee-1');
    assert.equal(second?.actorId, 'employee-2');
    assert.equal(anonymous?.actorId, null);
    assert.notEqual(first?.requestId, second?.requestId);
    assert.match(first?.requestId ?? '', /^[0-9a-f-]{36}$/);
    assert.ok(first?.ipAddress);
  } finally {
    await app.close();
  }

  assert.equal(getRequestContext(), undefined, 'nothing leaks outside a request');
});
