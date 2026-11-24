import { Num } from '../../src/kernel/model/Num';
import { SvgDocument } from '../../src/kernel/model/SvgDocument';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class InitHandler extends Command {
  readonly name = 'init';
  readonly usage = 'init [w] [h]';
  readonly summary = 'new empty canvas (default 800x600) as the current document';

  run(args: readonly Token[], session: EditorSession): void {
    const [w, h] = this.expectArgs(args, 0, 2);
    const doc = new SvgDocument(
      w === undefined ? SvgDocument.DEFAULT_WIDTH : Num.parse(w),
      h === undefined ? SvgDocument.DEFAULT_HEIGHT : Num.parse(h),
    );
    session.replaceDocument(doc, null);
    session.out.info(`canvas ${doc.sizeLabel()} created`);
  }
}
