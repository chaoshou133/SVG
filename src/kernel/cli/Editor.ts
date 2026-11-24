import { EditorError } from '../model/EditorError';
import type { EditorSession } from './EditorSession';
import { Tokenizer } from './Tokenizer';

/**
 * Executes one command line at a time: comment / blank handling, tokenizing,
 * dispatch through CommandRegistry, and turning EditorErrors into `error:` lines.
 */
export class Editor {
  static readonly VERSION = '0.1';

  private readonly tokenizer = new Tokenizer();

  constructor(readonly session: EditorSession) {}

  /** Returns false once the user asked to exit. */
  execute(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return true;
    }
    try {
      const [name, ...args] = this.tokenizer.tokenize(trimmed);
      this.session.commands.lookup(name.value).run(args, this.session);
    } catch (error) {
      if (!(error instanceof EditorError)) {
        throw error;
      }
      this.session.out.error(error.message);
    }
    return !this.session.shouldExit;
  }
}
