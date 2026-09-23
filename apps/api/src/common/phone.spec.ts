import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { formatTurkmenPhoneNumber } from './phone.js';

void describe('formatTurkmenPhoneNumber', () => {
  void it('adds the country code to a bare subscriber number', () => {
    assert.equal(formatTurkmenPhoneNumber('61123456'), '+99361123456');
  });

  void it('replaces the domestic trunk prefix', () => {
    assert.equal(formatTurkmenPhoneNumber('861123456'), '+99361123456');
  });

  void it('keeps an already normalised number', () => {
    assert.equal(formatTurkmenPhoneNumber('+99361123456'), '+99361123456');
  });

  void it('accepts the international dialling prefix', () => {
    assert.equal(formatTurkmenPhoneNumber('0099361123456'), '+99361123456');
  });

  void it('accepts the country code without a plus', () => {
    assert.equal(formatTurkmenPhoneNumber('99361123456'), '+99361123456');
  });

  void it('strips separators people type', () => {
    assert.equal(formatTurkmenPhoneNumber('+993 61 12 34 56'), '+99361123456');
    assert.equal(formatTurkmenPhoneNumber('61-12-34-56'), '+99361123456');
    assert.equal(formatTurkmenPhoneNumber('(993) 61 123456'), '+99361123456');
  });

  void it('supports every known prefix', () => {
    for (const prefix of ['60', '61', '62', '63', '64', '65', '71']) {
      assert.equal(formatTurkmenPhoneNumber(`${prefix}123456`), `+993${prefix}123456`);
    }
  });

  void it('leaves unknown prefixes and foreign numbers untouched', () => {
    assert.equal(formatTurkmenPhoneNumber('12123456'), '12123456');
    assert.equal(formatTurkmenPhoneNumber('+905321234567'), '+905321234567');
  });

  void it('leaves wrong-length numbers untouched', () => {
    assert.equal(formatTurkmenPhoneNumber('6112345'), '6112345');
    assert.equal(formatTurkmenPhoneNumber('611234567'), '611234567');
  });

  void it('does not match a number buried in a multi-line string', () => {
    // A multiline-flagged regex would accept this and produce "+993junk\n61123456".
    assert.equal(formatTurkmenPhoneNumber('junk\n61123456'), 'junk\n61123456');
  });

  void it('returns empty input unchanged', () => {
    assert.equal(formatTurkmenPhoneNumber(''), '');
    assert.equal(formatTurkmenPhoneNumber('   '), '');
  });
});
