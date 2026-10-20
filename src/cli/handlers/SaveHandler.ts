import { EditorError } from '../../model/EditorError';
import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class SaveHandler extends CliCommand {
  readonly name = 'save';
  readonly usage = 'save [file.svg]';
  readonly summary = 'save the document (default: the path it was read from / last saved to)';

  run(args: readonly Token[], session: EditorSession): void {
    const [given] = this.expectArgs(args, 0, 1);
    const doc = session.requireDocument();
    const path = given ?? session.filePath;
    if (path === null) {
      throw new EditorError("no file name. use 'save <file.svg>'");
    }
    session.fs.writeText(path, session.writer.write(doc));
    session.savedTo(path);
    session.out.info(`saved to ${path} (${doc.elementCount()} elements)`);
  }
}
