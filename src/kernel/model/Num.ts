import { EditorError } from './EditorError';

/** Numeric parsing and formatting shared by CLI commands, shapes and SVG IO. */
export class Num {
  private static readonly STRICT = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;

  /** Strict CLI parsing: rejects units (`10px`), NaN, Infinity and empty strings. */
  static parse(raw: string): number {
    if (!Num.STRICT.test(raw)) {
      throw new EditorError(`invalid number: ${raw}`);
    }
    const value = Number(raw);
    if (!Number.isFinite(value)) {
      throw new EditorError(`invalid number: ${raw}`);
    }
    return value;
  }

  /** Lenient file parsing: strips trailing CSS units like `px`, defaults to 0. */
  static parseLenient(raw: string | undefined): number {
    if (raw === undefined) {
      return 0;
    }
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /** Formats without binary floating-point noise (0.1 + 0.2 → `0.3`, -0 → `0`). */
  static format(value: number): string {
    const rounded = Number(value.toPrecision(12));
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }
}
