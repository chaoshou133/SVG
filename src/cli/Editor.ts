import type { FileSystem } from '../io/FileSystem';
import { EditorError } from '../model/EditorError';
import { CommandRegistry } from './CommandRegistry';
import { EditorSession } from './EditorSession';
import type { Output } from './Output';
import { Tokenizer } from './Tokenizer';

/**
 * Executes one command line at a time: comment / blank handling, tokenizing,
 * dispatch, and turning EditorErrors into `error:` lines. Independent of the
 * terminal, so tests and the REPL drive it identically.
 */
export class Editor {
  static readonly VERSION = '0.1';

  private readonly tokenizer = new Tokenizer();
  private readonly registry = CommandRegistry.standard();
  private readonly session: EditorSession;

  constructor(fs: FileSystem, private readonly out: Output) {
    this.session = new EditorSession(fs, out);
  }

  /** Returns false once the user asked to exit. */
  execute(line: string): boolean {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) {
      return true;
    }
    try {
      const [name, ...args] = this.tokenizer.tokenize(trimmed);
      this.registry.lookup(name.value).run(args, this.session);
    } catch (error) {
      if (!(error instanceof EditorError)) {
        throw error;
      }
      this.out.error(error.message);
    }
    return !this.session.shouldExit;
  }
}
