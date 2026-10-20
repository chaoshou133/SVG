import type { GeometricShape } from './GeometricShape';
import type { ShapeMemento } from './ShapeMemento';

/** Snapshot of one leaf shape's numeric geometry. */
export class GeometryMemento implements ShapeMemento {
  private readonly snapshot: ReadonlyMap<string, number>;

  constructor(private readonly target: GeometricShape, geometry: ReadonlyMap<string, number>) {
    this.snapshot = new Map(geometry);
  }

  restore(): void {
    this.target.restoreGeometry(this.snapshot);
  }
}
