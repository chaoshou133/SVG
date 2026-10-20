import { EditorError } from './EditorError';

/** Parsing and formatting of the numeric values used by geometry attributes. */
export class Num {
  private static readonly PATTERN = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;
  private static readonly PRECISION = 1e6;

  /** Strict parse for user input: rejects anything that is not a plain number. */
  static parse(text: string): number {
    if (!Num.PATTERN.test(text)) {
      throw new EditorError(`invalid number: ${text}`);
    }
    return Number(text);
  }

  /** Lenient parse for SVG files: accepts units such as "10px", falls back to 0. */
  static parseLenient(text: string | undefined): number {
    const value = text === undefined ? NaN : parseFloat(text);
    return Number.isFinite(value) ? value : 0;
  }

  /** Formats without floating point noise: 0.1 + 0.2 prints as 0.3. */
  static format(value: number): string {
    const rounded = Math.round(value * Num.PRECISION) / Num.PRECISION;
    return Object.is(rounded, -0) ? '0' : String(rounded);
  }
}
