import { ScaleCommand } from '../../src/kernel/commands/ScaleCommand';
import { Num } from '../../src/kernel/model/Num';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class ScaleHandler extends Command {
  readonly name = 'scale';
  readonly usage = 'scale <id> <factor>';
  readonly summary = 'multiply all geometry (position and size) by factor; recursive for containers';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id, factor] = this.expectArgs(args, 2);
    session.edit(new ScaleCommand(doc, id, Num.parse(factor)));
  }
}
