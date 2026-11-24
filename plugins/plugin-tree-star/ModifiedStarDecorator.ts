import type { DocumentEvent } from '../../src/kernel/ext/DocumentEvent';
import type { DocumentEventListener } from '../../src/kernel/ext/DocumentEventListener';
import type { TreeDecorator } from '../../src/kernel/ext/TreeDecorator';
import type { Shape } from '../../src/kernel/model/Shape';
import type { SvgDocument } from '../../src/kernel/model/SvgDocument';

/**
 * TreeDecorator (`modified-star`) appending `*` to unsaved document changes.
 *
 * State encapsulation:
 *  - All dirty-tracking snapshots live purely in instance fields (zero module globals).
 * Dirty semantics (ADR-03):
 *  - Compares current node fingerprints against the baseline captured at the last
 *    `init` / `read` / `save`.
 *  - Newly created or modified nodes receive `*`; `undo` back to the saved state
 *    clears `*` automatically.
 *  - Root `svg (WxH)` receives `*` whenever any node or canvas size differs from baseline;
 *    intermediate container rows do not duplicate `*` unless their own attributes/parent changed.
 */
export class ModifiedStarDecorator implements TreeDecorator, DocumentEventListener {
  readonly name = 'modified-star';

  private savedCanvas = '';
  private savedNodes = new Map<string, string>();
  private dirtyIds = new Set<string>();
  private rootDirty = false;
  private initialized = false;

  onDocumentEvent(event: DocumentEvent): void {
    if (event.kind === 'init' || event.kind === 'read' || event.kind === 'save') {
      this.captureBaseline(event.document);
      return;
    }
    this.recomputeDirty(event.document);
  }

  decorate(shape: Shape | null, _doc: SvgDocument): string | null {
    if (!this.initialized) {
      return null;
    }
    if (shape === null) {
      return this.rootDirty ? '*' : null;
    }
    return this.dirtyIds.has(shape.id) ? '*' : null;
  }

  private captureBaseline(doc: SvgDocument): void {
    this.initialized = true;
    this.savedCanvas = doc.sizeLabel();
    this.savedNodes = new Map<string, string>();
    for (const shape of doc.allShapes()) {
      this.savedNodes.set(shape.id, this.fingerprint(shape));
    }
    this.dirtyIds = new Set<string>();
    this.rootDirty = false;
  }

  private recomputeDirty(doc: SvgDocument): void {
    if (!this.initialized) {
      this.captureBaseline(doc);
      return;
    }
    const currentShapes = doc.allShapes();
    const currentIds = new Set<string>();
    const nextDirty = new Set<string>();

    for (const shape of currentShapes) {
      currentIds.add(shape.id);
      const saved = this.savedNodes.get(shape.id);
      if (saved === undefined || saved !== this.fingerprint(shape)) {
        nextDirty.add(shape.id);
      }
    }

    let anyDeleted = false;
    for (const oldId of this.savedNodes.keys()) {
      if (!currentIds.has(oldId)) {
        anyDeleted = true;
        break;
      }
    }

    this.dirtyIds = nextDirty;
    this.rootDirty = doc.sizeLabel() !== this.savedCanvas || nextDirty.size > 0 || anyDeleted;
  }

  private fingerprint(shape: Shape): string {
    const attrs = shape.svgAttributes().map(([k, v]) => `${k}=${v}`).join(';');
    const text = shape.textContent() ?? '';
    const parentLabel = shape.parent?.label() ?? '';
    const siblingIndex = shape.parent ? shape.parent.indexOf(shape) : -1;
    return `${shape.tagName}|${parentLabel}|${siblingIndex}|${attrs}|${text}`;
  }
}
