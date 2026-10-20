import { Num } from '../../model/Num';
import { SvgDocument } from '../../model/SvgDocument';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class InitHandler extends CliCommand {
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
