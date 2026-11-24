import type { EditorSession } from '../cli/EditorSession';
import type { Token } from '../cli/Token';
import { EditorError } from '../model/EditorError';

/**
 * Extension Point 2 (`Command`):
 * A REPL command registered by built-in or external command plugins.
 */
export abstract class Command {
  abstract readonly name: string;
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
