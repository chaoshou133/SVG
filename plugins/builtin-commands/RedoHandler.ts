import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class RedoHandler extends Command {
  readonly name = 'redo';
  readonly usage = 'redo';
  readonly summary = 'redo the last undone command (cleared by any new edit)';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    session.requireDocument();
    session.redo();
  }
}
