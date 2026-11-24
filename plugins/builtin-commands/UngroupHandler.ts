import { UngroupCommand } from '../../src/kernel/commands/UngroupCommand';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class UngroupHandler extends Command {
  readonly name = 'ungroup';
  readonly usage = 'ungroup <gid>';
  readonly summary = "dissolve a container; children take its place in the container's parent";

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 1);
    session.edit(new UngroupCommand(doc, id));
  }
}
