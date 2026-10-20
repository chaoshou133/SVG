import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class UndoHandler extends CliCommand {
  readonly name = 'undo';
  readonly usage = 'undo';
  readonly summary = 'undo the last editing command';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    session.requireDocument();
    session.out.info(session.history.undo());
  }
}
