import { AddToCommand } from '../../commands/AddToCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class AddToHandler extends CliCommand {
  readonly name = 'addto';
  readonly usage = 'addto <gid> <id>';
  readonly summary = 'move an existing shape into a container (as its last child)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [containerId, id] = this.expectArgs(args, 2);
    session.edit(new AddToCommand(doc, containerId, id));
  }
}
