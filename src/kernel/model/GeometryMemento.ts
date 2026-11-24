import type { ShapeMemento } from './ShapeMemento';

/** Snapshot of a leaf shape's numeric geometry map. */
export class GeometryMemento implements ShapeMemento {
  private readonly saved: [string, number][];

  constructor(
    private readonly target: Map<string, number>,
    entries: Iterable<[string, number]>,
  ) {
    this.saved = [...entries];
  }

  restore(): void {
    this.target.clear();
    for (const [key, value] of this.saved) {
      this.target.set(key, value);
    }
  }
}
