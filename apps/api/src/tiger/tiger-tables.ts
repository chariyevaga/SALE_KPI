import { getFirmNumber, getTigerPeriodNumber } from '../config/environment.js';

/** Logo table suffixes are upper-case identifiers such as `INVOICE` or `CLCARD`. */
const TABLE_SUFFIX = /^[A-Z][A-Z0-9_]{0,63}$/;

/**
 * Logo Tiger table names of the configured firm and period (ADR-037). Firm and period
 * data live in tables named after them (`LG_003_CLCARD`, `LG_003_01_INVOICE`), so the
 * names have to be built. They are built only from validated integers and fixed
 * suffixes; values always travel as query parameters.
 */
export class TigerTables {
  readonly firm: number;
  readonly period: number;

  constructor(firm: number, period: number) {
    if (!Number.isInteger(firm) || firm < 1 || firm > 999) {
      throw new Error(`Tiger firm number must be an integer between 1 and 999 (got ${firm}).`);
    }

    if (!Number.isInteger(period) || period < 1 || period > 99) {
      throw new Error(`Tiger period number must be an integer between 1 and 99 (got ${period}).`);
    }

    this.firm = firm;
    this.period = period;
  }

  static fromEnvironment(): TigerTables {
    return new TigerTables(getFirmNumber(), getTigerPeriodNumber());
  }

  /** Firm-level table, e.g. `CLCARD` → `[LG_003_CLCARD]`. */
  firmTable(suffix: string): string {
    return `[LG_${this.firmCode()}_${assertSuffix(suffix)}]`;
  }

  /** Period-level table, e.g. `INVOICE` → `[LG_003_01_INVOICE]`. */
  periodTable(suffix: string): string {
    return `[LG_${this.firmCode()}_${String(this.period).padStart(2, '0')}_${assertSuffix(suffix)}]`;
  }

  private firmCode(): string {
    return String(this.firm).padStart(3, '0');
  }
}

function assertSuffix(suffix: string): string {
  if (!TABLE_SUFFIX.test(suffix)) {
    throw new Error(`"${suffix}" is not a Logo table suffix.`);
  }

  return suffix;
}
