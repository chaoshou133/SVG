import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';
import { Command } from '../../src/kernel/ext/Command';
import { TreeRenderer } from '../../src/kernel/view/TreeRenderer';

export class TreeHandler extends Command {
  readonly name = 'tree';
  readonly usage = 'tree [id]';
  readonly summary = 'structure tree with inline geometry (whole document or one subtree)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 0, 1);
    const renderer = new TreeRenderer(session.decorators);
    const lines = id === undefined ? renderer.renderDocument(doc) : renderer.renderSubtree(doc.require(id), doc);
    lines.forEach((line) => session.out.info(line));
  }
}
