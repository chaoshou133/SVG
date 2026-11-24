import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class UndoHandler extends Command {
  readonly name = 'undo';
  readonly usage = 'undo';
  readonly summary = 'undo the last editing command';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    session.requireDocument();
    session.undo();
  }
}
