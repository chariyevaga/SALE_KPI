import 'reflect-metadata';

import assert from 'node:assert/strict';
import { test } from 'node:test';

import { GUARDS_METADATA } from '@nestjs/common/constants.js';

import { AccessTokenGuard } from '../auth/access-token.guard.js';
import { FullAccessGuard } from '../auth/full-access.guard.js';
import { EmployeeSalariesController } from './employee-salaries.controller.js';

type Handler = keyof EmployeeSalariesController;

function guardsOf(handler: Handler): unknown[] {
  // Nest keeps method guards on the handler function itself.
  const method = Object.getOwnPropertyDescriptor(EmployeeSalariesController.prototype, handler)
    ?.value as object | undefined;

  assert.ok(method, `${handler} is not a handler of the controller`);

  return (Reflect.getMetadata(GUARDS_METADATA, method) as unknown[] | undefined) ?? [];
}

void test('every salary endpoint needs a signed-in employee', () => {
  const classGuards = Reflect.getMetadata(GUARDS_METADATA, EmployeeSalariesController) as unknown[];

  assert.deepEqual(classGuards, [AccessTokenGuard]);
});

void test('only full_access users read other salaries or change any (ADR-048)', () => {
  const adminOnly: Handler[] = ['list', 'inForce', 'create', 'update', 'remove'];

  for (const handler of adminOnly) {
    assert.ok(guardsOf(handler).includes(FullAccessGuard), `${handler} must require full_access`);
  }
});

void test('an employee reads only their own salary, without full_access', () => {
  assert.equal(guardsOf('mine').includes(FullAccessGuard), false);
});
