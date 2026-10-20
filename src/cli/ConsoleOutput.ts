import type { Output } from './Output';

/** Output to stdout (errors and warnings too, so a replayed script keeps its order). */
export class ConsoleOutput implements Output {
  info(line: string): void {
    process.stdout.write(`${line}\n`);
  }

  warn(message: string): void {
    process.stdout.write(`warning: ${message}\n`);
  }

  error(message: string): void {
    process.stdout.write(`error: ${message}\n`);
  }
}
