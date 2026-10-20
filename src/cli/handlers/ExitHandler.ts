import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ExitHandler extends CliCommand {
  readonly name = 'exit';
  readonly usage = 'exit';
  readonly summary = 'leave the editor (unsaved changes are lost)';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    session.requestExit();
  }
}
