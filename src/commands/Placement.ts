import type { Container } from '../model/Container';
import type { Shape } from '../model/Shape';

/** Where a shape was before a structural command detached it; used to undo. */
export class Placement {
  constructor(
    readonly shape: Shape,
    readonly parent: Container,
    readonly index: number,
  ) {}

  /** Detaches the shape and remembers where it was. */
  static detach(shape: Shape): Placement {
    const parent = shape.parent as Container;
    return new Placement(shape, parent, parent.remove(shape));
  }

  restore(): void {
    this.parent.insert(this.shape, this.index);
  }
}
