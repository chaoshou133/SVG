import { ScaleCommand } from '../../commands/ScaleCommand';
import { Num } from '../../model/Num';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ScaleHandler extends CliCommand {
  readonly name = 'scale';
  readonly usage = 'scale <id> <factor>';
  readonly summary = 'multiply all geometry (position and size) by factor; recursive for containers';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id, factor] = this.expectArgs(args, 2);
    session.edit(new ScaleCommand(doc, id, Num.parse(factor)));
  }
}
