import { EditorError } from '../model/EditorError';
import type { EditorSession } from './EditorSession';
import type { Token } from './Token';

/** A REPL command: parses its arguments and drives the session. */
export abstract class CliCommand {
  abstract readonly name: string;
  /** Syntax shown by `help` and in usage errors. */
  abstract readonly usage: string;
  abstract readonly summary: string;

  abstract run(args: readonly Token[], session: EditorSession): void;

  protected expectArgs(args: readonly Token[], min: number, max: number = min): string[] {
    if (args.length < min || args.length > max) {
      throw new EditorError(`usage: ${this.usage}`);
    }
    return args.map((token) => token.value);
  }
}
