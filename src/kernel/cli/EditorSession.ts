import { CommandHistory } from '../commands/CommandHistory';
import type { UndoableCommand } from '../commands/UndoableCommand';
import { AttributeHandlerRegistry } from '../ext/AttributeHandlerRegistry';
import { CommandRegistry } from '../ext/CommandRegistry';
import { DocumentEvent } from '../ext/DocumentEvent';
import { DocumentEventBus } from '../ext/DocumentEventBus';
import { PluginManager } from '../ext/PluginManager';
import { ShapeRegistry } from '../ext/ShapeRegistry';
import { TreeDecoratorRegistry } from '../ext/TreeDecoratorRegistry';
import type { DirectoryAccess } from '../io/DirectoryAccess';
import type { FileSystem } from '../io/FileSystem';
import { SvgReader } from '../io/SvgReader';
import { SvgWriter } from '../io/SvgWriter';
import { EditorError } from '../model/EditorError';
import type { SvgDocument } from '../model/SvgDocument';
import type { Output } from './Output';

/**
 * Shared state & extension registries owned by the kernel.
 * Knows zero concrete shapes, zero concrete commands, and zero concrete plugins.
 */
export class EditorSession {
  readonly shapes = new ShapeRegistry();
  readonly commands = new CommandRegistry();
  readonly decorators = new TreeDecoratorRegistry();
  readonly attributes = new AttributeHandlerRegistry();
  readonly events = new DocumentEventBus();
  readonly reader = new SvgReader(this.shapes);
  readonly writer = new SvgWriter();
  readonly history = new CommandHistory();
  readonly plugins: PluginManager;

  private document: SvgDocument | null = null;
  private path: string | null = null;
  private exitRequested = false;

  constructor(
    readonly fs: FileSystem,
    readonly out: Output,
    readonly directoryAccess: DirectoryAccess,
  ) {
    this.plugins = new PluginManager(
      this.shapes,
      this.commands,
      this.decorators,
      this.attributes,
      this.events,
      this.directoryAccess,
      this.out,
    );
  }

  requireDocument(): SvgDocument {
    if (this.document === null) {
      throw new EditorError("no document. use 'init' or 'read' first");
    }
    return this.document;
  }

  get currentDocument(): SvgDocument | null {
    return this.document;
  }

  get filePath(): string | null {
    return this.path;
  }

  /** init / read: install a new document; history from the old one is cleared. */
  replaceDocument(doc: SvgDocument, path: string | null, kind: 'init' | 'read' = path === null ? 'init' : 'read'): void {
    this.document = doc;
    this.path = path;
    this.history.lockAfterIo();
    this.events.emit(new DocumentEvent(kind, doc));
  }

  /** canvas resize: IO-level change that locks undo and notifies observers. */
  canvasResized(doc: SvgDocument): void {
    this.history.lockAfterIo();
    this.events.emit(new DocumentEvent('canvas', doc));
  }

  /** save: remember where the document now lives and notify observers. */
  savedTo(path: string): void {
    this.path = path;
    this.history.lockAfterIo();
    if (this.document !== null) {
      this.events.emit(new DocumentEvent('save', this.document));
    }
  }

  /** Runs an undoable edit, prints its feedback, and notifies document observers. */
  edit(command: UndoableCommand): void {
    const message = this.history.execute(command);
    this.out.info(message);
    if (this.document !== null) {
      this.events.emit(new DocumentEvent('edit', this.document));
    }
  }

  undo(): void {
    const message = this.history.undo();
    this.out.info(message);
    if (this.document !== null) {
      this.events.emit(new DocumentEvent('undo', this.document));
    }
  }

  redo(): void {
    const message = this.history.redo();
    this.out.info(message);
    if (this.document !== null) {
      this.events.emit(new DocumentEvent('redo', this.document));
    }
  }

  requestExit(): void {
    this.exitRequested = true;
  }

  get shouldExit(): boolean {
    return this.exitRequested;
  }
}
