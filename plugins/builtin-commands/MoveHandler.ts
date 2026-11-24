import { MoveCommand } from '../../src/kernel/commands/MoveCommand';
import { Num } from '../../src/kernel/model/Num';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class MoveHandler extends Command {
  readonly name = 'move';
  readonly usage = 'move <id> <dx> <dy>';
  readonly summary = 'translate a shape or container by a relative offset';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id, dx, dy] = this.expectArgs(args, 3);
    session.edit(new MoveCommand(doc, id, Num.parse(dx), Num.parse(dy)));
  }
}
