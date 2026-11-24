import { EditorError } from '../../src/kernel/model/EditorError';
import { Command } from '../../src/kernel/ext/Command';
import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';

export class SaveHandler extends Command {
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
