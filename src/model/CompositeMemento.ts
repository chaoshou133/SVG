import type { ShapeMemento } from './ShapeMemento';

/** Snapshot of a group: the snapshots of all its children. */
export class CompositeMemento implements ShapeMemento {
  constructor(private readonly parts: readonly ShapeMemento[]) {}

  restore(): void {
    for (const part of this.parts) {
      part.restore();
    }
  }
}
