import { ZOrderCommand } from '../../commands/ZOrderCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

/** Serves both `front` and `back`. */
export class ZOrderHandler extends CliCommand {
  readonly usage: string;
  readonly summary: string;

  constructor(
    readonly name: string,
    private readonly toFront: boolean,
  ) {
    super();
    this.usage = `${name} <id>`;
    this.summary = toFront ? 'bring to front among siblings (painted last)' : 'send to back among siblings (painted first)';
  }

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 1);
    session.edit(new ZOrderCommand(doc, id, this.toFront));
  }
}
