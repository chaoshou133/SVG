import type { ShapeMemento } from './ShapeMemento';

/** Snapshot of a container: restores every child memento in order. */
export class CompositeMemento implements ShapeMemento {
  constructor(private readonly children: readonly ShapeMemento[]) {}

  restore(): void {
    for (const child of this.children) {
      child.restore();
    }
  }
}
