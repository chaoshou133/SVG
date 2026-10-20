import { TreeRenderer } from '../../view/TreeRenderer';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class TreeHandler extends CliCommand {
  readonly name = 'tree';
  readonly usage = 'tree [id]';
  readonly summary = 'structure tree with inline geometry (whole document or one subtree)';
  private readonly renderer = new TreeRenderer();

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 0, 1);
    const lines = id === undefined ? this.renderer.renderDocument(doc) : this.renderer.renderSubtree(doc.require(id));
    lines.forEach((line) => session.out.info(line));
  }
}
