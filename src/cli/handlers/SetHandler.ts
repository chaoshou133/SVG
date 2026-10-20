import { SetAttributeCommand } from '../../commands/SetAttributeCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class SetHandler extends CliCommand {
  readonly name = 'set';
  readonly usage = 'set <id> <attr> <value>';
  readonly summary = 'set fill / stroke / stroke-width, a geometry attribute, or text content';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id, attr, value] = this.expectArgs(args, 3);
    session.edit(new SetAttributeCommand(doc, id, attr, value));
  }
}
