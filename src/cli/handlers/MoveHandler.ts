import { MoveCommand } from '../../commands/MoveCommand';
import { Num } from '../../model/Num';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class MoveHandler extends CliCommand {
  readonly name = 'move';
  readonly usage = 'move <id> <dx> <dy>';
  readonly summary = 'translate a shape or container by a relative offset';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id, dx, dy] = this.expectArgs(args, 3);
    session.edit(new MoveCommand(doc, id, Num.parse(dx), Num.parse(dy)));
  }
}
