import { CreateShapeCommand } from '../../commands/CreateShapeCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class CreateHandler extends CliCommand {
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
    const shape = session.factory.createFromArgs(type, id, params.map((token) => token.value));
    session.edit(new CreateShapeCommand(doc, shape, containerId));
  }
}
