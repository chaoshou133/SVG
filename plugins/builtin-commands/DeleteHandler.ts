import { DeleteCommand } from '../../src/kernel/commands/DeleteCommand';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class DeleteHandler extends Command {
  readonly name = 'delete';
  readonly usage = 'delete <id>';
  readonly summary = 'delete a shape (a container with all its descendants)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 1);
    session.edit(new DeleteCommand(doc, id));
  }
}
