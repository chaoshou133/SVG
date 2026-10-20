import { GroupCommand } from '../../commands/GroupCommand';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class GroupHandler extends CliCommand {
  readonly name = 'group';
  readonly usage = 'group <newGid> <id1> <id2>…';
  readonly summary = 'wrap existing shapes in a new container';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [groupId, ...memberIds] = this.expectArgs(args, 2, Infinity);
    session.edit(new GroupCommand(doc, groupId, memberIds));
  }
}
