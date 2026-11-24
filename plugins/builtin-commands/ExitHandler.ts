import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class ExitHandler extends Command {
  readonly name = 'exit';
  readonly usage = 'exit';
  readonly summary = 'leave the editor (unsaved changes are lost)';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    session.requestExit();
  }
}
