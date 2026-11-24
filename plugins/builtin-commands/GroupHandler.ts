import { GroupCommand } from '../../src/kernel/commands/GroupCommand';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class GroupHandler extends Command {
  readonly name = 'group';
  readonly usage = 'group <newGid> <id1> <id2>…';
  readonly summary = 'wrap existing shapes in a new container';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [groupId, ...memberIds] = this.expectArgs(args, 2, Infinity);
    session.edit(new GroupCommand(doc, groupId, memberIds, session.shapes));
  }
}
