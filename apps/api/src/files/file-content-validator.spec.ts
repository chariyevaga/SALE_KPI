import assert from 'node:assert/strict';
import { test } from 'node:test';

import { BadRequestException } from '@nestjs/common';

import { validateFileContent } from './file-content-validator.js';

void test('accepts a file when its JPEG signature matches its MIME type', () => {
  assert.doesNotThrow(() =>
    validateFileContent(Buffer.from([0xff, 0xd8, 0xff, 0x00]), 'image/jpeg'),
  );
});

void test('rejects a file whose content does not match its declared MIME type', () => {
  assert.throws(
    () => validateFileContent(Buffer.from('not-an-image'), 'image/png'),
    BadRequestException,
  );
});
