import { UngroupCommand } from '../../commands/UngroupCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class UngroupHandler extends CliCommand {
  readonly name = 'ungroup';
  readonly usage = 'ungroup <gid>';
  readonly summary = "dissolve a container; children take its place in the container's parent";

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 1);
    session.edit(new UngroupCommand(doc, id));
  }
}
