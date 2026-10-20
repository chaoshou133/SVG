import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class RedoHandler extends CliCommand {
  readonly name = 'redo';
  readonly usage = 'redo';
  readonly summary = 'redo the last undone command (cleared by any new edit)';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    session.requireDocument();
    session.out.info(session.history.redo());
  }
}
