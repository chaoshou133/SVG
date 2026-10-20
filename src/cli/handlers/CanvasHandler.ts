import { Num } from '../../model/Num';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class CanvasHandler extends CliCommand {
  readonly name = 'canvas';
  readonly usage = 'canvas [w h]';
  readonly summary = 'show the canvas size, or change it (an io command: clears undo history)';

  run(args: readonly Token[], session: EditorSession): void {
    const doc = session.requireDocument();
    if (args.length === 0) {
      session.out.info(`canvas ${doc.sizeLabel()}`);
      return;
    }
    const [w, h] = this.expectArgs(args, 2);
    doc.resize(Num.parse(w), Num.parse(h));
    session.history.lockAfterIo();
    session.out.info(`canvas resized to ${doc.sizeLabel()}`);
  }
}
