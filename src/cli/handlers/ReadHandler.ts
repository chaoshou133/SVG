import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class ReadHandler extends CliCommand {
  readonly name = 'read';
  readonly usage = 'read <file.svg>';
  readonly summary = 'load an SVG file as the current document';

  run(args: readonly Token[], session: EditorSession): void {
    const [path] = this.expectArgs(args, 1);
    const warnings: string[] = [];
    const doc = session.reader.read(session.fs.readText(path), (message) => warnings.push(message));
    // Warnings are printed only once the whole file is accepted: a failed read changes nothing.
    warnings.forEach((message) => session.out.warn(message));
    session.replaceDocument(doc, path);
    session.out.info(`read ${path} (${doc.elementCount()} elements)`);
  }
}
