import { Num } from '../../src/kernel/model/Num';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class CanvasHandler extends Command {
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
    session.canvasResized(doc);
    session.out.info(`canvas resized to ${doc.sizeLabel()}`);
  }
}
