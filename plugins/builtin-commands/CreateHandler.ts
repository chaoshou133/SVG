import { CreateShapeCommand } from '../../src/kernel/commands/CreateShapeCommand';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class CreateHandler extends Command {
  readonly name = 'create';
  readonly usage = 'create <type> <id> [params…] [in <containerId>]';
  readonly summary = 'create a shape (types: rect circle ellipse line text g)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [type, id] = this.expectArgs(args.slice(0, 2), 2);
    let params = args.slice(2);
    let containerId: string | null = null;
    if (params.length >= 2 && params[params.length - 2].isKeyword('in')) {
      containerId = params[params.length - 1].value;
      params = params.slice(0, -2);
    }
    const shape = session.shapes.createFromArgs(type, id, params.map((token) => token.value));
    session.edit(new CreateShapeCommand(doc, shape, containerId));
  }
}
