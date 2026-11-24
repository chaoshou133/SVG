import type { Container } from './Container';
import { EditorError } from './EditorError';
import type { Shape } from './Shape';

/** Encapsulates ordered child storage and keeps Shape.parent in sync. */
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
      throw new EditorError(`shape already attached: ${shape.id}`);
    }
    const clamped = Math.max(0, Math.min(index, this.items.length));
    this.items.splice(clamped, 0, shape);
    shape.attachTo(this.owner);
  }

  remove(shape: Shape): number {
    const index = this.items.indexOf(shape);
    if (index === -1) {
      throw new EditorError(`shape ${shape.id} is not a child of ${this.owner.label()}`);
    }
    this.items.splice(index, 1);
    shape.attachTo(null);
    return index;
  }
}
