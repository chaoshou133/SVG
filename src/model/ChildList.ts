import type { Container } from './Container';
import type { Shape } from './Shape';

/**
 * Ordered child storage shared by every Container. It is the only place that
 * changes a shape's parent pointer, so parent and child lists never disagree.
 */
export class ChildList {
  private readonly items: Shape[] = [];

  constructor(private readonly owner: Container) {}

  all(): readonly Shape[] {
    return this.items;
  }

  indexOf(shape: Shape): number {
    return this.items.indexOf(shape);
  }

  insert(shape: Shape, index: number = this.items.length): void {
    if (shape.parent !== null) {
      throw new Error(`internal: ${shape.ref()} is still attached to ${shape.parent.label()}`);
    }
    const at = Math.max(0, Math.min(index, this.items.length));
    this.items.splice(at, 0, shape);
    shape.attachTo(this.owner);
  }

  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index < 0) {
      throw new Error(`internal: ${shape.ref()} is not a child of ${this.owner.label()}`);
    }
    this.items.splice(index, 1);
    shape.attachTo(null);
    return index;
  }
}
