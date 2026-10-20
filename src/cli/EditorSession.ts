import type { Command } from '../commands/Command';
import { CommandHistory } from '../commands/CommandHistory';
import { ShapeFactory } from '../factory/ShapeFactory';
import type { FileSystem } from '../io/FileSystem';
import { SvgReader } from '../io/SvgReader';
import { SvgWriter } from '../io/SvgWriter';
import { EditorError } from '../model/EditorError';
import type { SvgDocument } from '../model/SvgDocument';
import type { Output } from './Output';

/** State shared by all CLI command handlers: current document, its path, history and services. */
export class EditorSession {
  readonly factory = new ShapeFactory();
  readonly reader = new SvgReader(this.factory);
  readonly writer = new SvgWriter();
  readonly history = new CommandHistory();

  private document: SvgDocument | null = null;
  private path: string | null = null;
  private exitRequested = false;

  constructor(
    readonly fs: FileSystem,
    readonly out: Output,
  ) {}

  requireDocument(): SvgDocument {
    if (this.document === null) {
      throw new EditorError("no document. use 'init' or 'read' first");
    }
    return this.document;
  }

  get filePath(): string | null {
    return this.path;
  }

  /** init / read: install a new document; history from the old one is meaningless now. */
  replaceDocument(doc: SvgDocument, path: string | null): void {
    this.document = doc;
    this.path = path;
    this.history.lockAfterIo();
  }

  /** save: remember where the document now lives. */
  savedTo(path: string): void {
    this.path = path;
    this.history.lockAfterIo();
  }

  /** Runs an undoable edit and prints its feedback. */
  edit(command: Command): void {
    this.out.info(this.history.execute(command));
  }

  requestExit(): void {
    this.exitRequested = true;
  }

  get shouldExit(): boolean {
    return this.exitRequested;
  }
}
