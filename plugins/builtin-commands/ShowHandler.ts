import { ShowRenderer } from '../../src/kernel/view/ShowRenderer';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class ShowHandler extends Command {
  readonly name = 'show';
  readonly usage = 'show <id>';
  readonly summary = 'all attributes of one shape';
  private readonly renderer = new ShowRenderer();

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    const [id] = this.expectArgs(args, 1);
    this.renderer.render(doc.require(id)).forEach((line) => session.out.info(line));
  }
}
