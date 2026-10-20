import { ShowRenderer } from '../../view/ShowRenderer';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ShowHandler extends CliCommand {
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
