import type { AttributeContext } from '../ext/AttributeContext';
import type { AttributeHandlerRegistry } from '../ext/AttributeHandlerRegistry';
import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { ShapeStateSnapshot } from '../model/ShapeStateSnapshot';
import type { SvgDocument } from '../model/SvgDocument';
import type { UndoableCommand } from './UndoableCommand';

/**
 * `set <id> <attr> <value>`
 *
 * Execution flow (§3.2):
 *  1. Locate target shape in document; query AttributeHandlerRegistry.
 *  2. If a handler matches: run inside a document-state snapshot transaction.
 *     - On error: restore pre-snapshot immediately, do NOT fall back to default,
 *       and rethrow EditorError so CommandHistory remains untouched.
 *     - On success: store pre/post snapshots so one undo/redo atomically reverts
 *       or reapplies all sub-part mutations.
 *  3. If no handler matches: apply Phase 1 default whitelist on `shape`.
 */
export class SetAttributeCommand implements UndoableCommand {
  private shape: Shape | null = null;
  private previous: string | undefined;

  // Transactional fields when handled by an AttributeHandler
  private handledByPlugin = false;
  private beforeSnapshot: ShapeStateSnapshot | null = null;
  private afterSnapshot: ShapeStateSnapshot | null = null;
  private executeMsg = '';
  private undoMsg = '';

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
    private readonly name: string,
    private readonly value: string,
    private readonly handlers?: AttributeHandlerRegistry,
  ) {}

  execute(): string {
    // Redo path for plugin-handled transaction
    if (this.handledByPlugin && this.afterSnapshot !== null) {
      this.afterSnapshot.restore();
      return this.executeMsg;
    }

    const shape = this.doc.require(this.id);
    if (this.handlers !== undefined) {
      const ctx: AttributeContext = {
        document: this.doc,
        getShape: (shapeId: string) => this.doc.require(shapeId),
      };
      const handler = this.handlers.resolve(this.id, this.name, ctx);
      if (handler !== null) {
        const before = this.doc.snapshotStates();
        try {
          const result = handler.apply(this.id, this.name, this.value, ctx);
          this.handledByPlugin = true;
          this.beforeSnapshot = before;
          this.afterSnapshot = this.doc.snapshotStates();
          this.executeMsg = result.executeMessage;
          this.undoMsg = result.undoMessage;
          return this.executeMsg;
        } catch (err) {
          before.restore();
          if (err instanceof EditorError) {
            throw err;
          }
          throw new EditorError(err instanceof Error ? err.message : String(err));
        }
      }
    }

    // Default Phase 1 attribute whitelist path
    const previous = shape.getAttribute(this.name);
    shape.setAttribute(this.name, this.value);
    this.shape = shape;
    this.previous = previous;
    return this.describe(this.value);
  }

  undo(): string {
    if (this.handledByPlugin) {
      (this.beforeSnapshot as ShapeStateSnapshot).restore();
      return this.undoMsg;
    }
    const shape = this.shape as Shape;
    if (this.previous === undefined) {
      shape.removeAttribute(this.name);
      return `${shape.ref()} updated: ${this.name} unset`;
    }
    shape.setAttribute(this.name, this.previous);
    return this.describe(this.previous);
  }

  private describe(value: string): string {
    const shown = this.name === 'text' ? `"${value}"` : value;
    return `${(this.shape as Shape).ref()} updated: ${this.name}=${shown}`;
  }
}
