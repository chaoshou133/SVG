import { AddToCommand } from '../../src/kernel/commands/AddToCommand';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class AddToHandler extends Command {
  readonly name = 'addto';
  readonly usage = 'addto <gid> <id>';
  readonly summary = 'move an existing shape into a container (as its last child)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [containerId, id] = this.expectArgs(args, 2);
    session.edit(new AddToCommand(doc, containerId, id));
  }
}
