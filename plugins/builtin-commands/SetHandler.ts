import { SetAttributeCommand } from '../../src/kernel/commands/SetAttributeCommand';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class SetHandler extends Command {
  readonly name = 'set';
  readonly usage = 'set <id> <attr> <value>';
  readonly summary = 'set fill / stroke / stroke-width, a geometry attribute, or text content';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id, attr, value] = this.expectArgs(args, 3);
    session.edit(new SetAttributeCommand(doc, id, attr, value, session.attributes));
  }
}
