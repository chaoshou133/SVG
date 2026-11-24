import type { Output } from './Output';

/** Output collected in memory; used by tests and transcript replay. */
export class BufferOutput implements Output {
  readonly lines: string[] = [];

  info(line: string): void {
    this.lines.push(line);
  }

  warn(message: string): void {
    this.lines.push(`warning: ${message}`);
  }

  error(message: string): void {
    this.lines.push(`error: ${message}`);
  }

  take(): string[] {
    return this.lines.splice(0, this.lines.length);
  }
}
