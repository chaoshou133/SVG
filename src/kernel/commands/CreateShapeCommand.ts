import type { Container } from '../model/Container';
import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { UndoableCommand } from './UndoableCommand';

/**
 * `create <type> <id> … [in <containerId>]`
 * Atomically checks every id in the new shape's subtree (supporting composite
 * plugin shapes like `box` with derived child ids) before mutating the document.
 */
export class CreateShapeCommand implements UndoableCommand {
  private target: Container | null = null;

  constructor(
    private readonly doc: SvgDocument,
    private readonly shape: Shape,
    private readonly containerId: string | null,
  ) {}

  execute(): string {
    const seen = new Set<string>();
    for (const node of this.shape.subtree()) {
      if (seen.has(node.id)) {
        throw new EditorError(`id already exists: ${node.id}`);
      }
      seen.add(node.id);
      this.doc.requireNewId(node.id);
    }
    const target = this.containerId === null ? this.doc : this.doc.requireContainer(this.containerId);
    target.insert(this.shape);
    this.target = target;
    return this.shape.describeCreate(this.containerId === null ? null : target.label());
  }

  undo(): string {
    (this.target as Container).remove(this.shape);
    return `${this.shape.ref()} creation undone`;
  }
}
