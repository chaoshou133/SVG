import { DeleteCommand } from '../../commands/DeleteCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class DeleteHandler extends CliCommand {
  readonly name = 'delete';
  readonly usage = 'delete <id>';
  readonly summary = 'delete a shape (a container with all its descendants)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 1);
    session.edit(new DeleteCommand(doc, id));
  }
}
