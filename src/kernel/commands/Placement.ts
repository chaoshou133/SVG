import type { Container } from '../model/Container';
import type { Shape } from '../model/Shape';

/** Remembers a shape's parent container and child index so commands can restore it on undo. */
export class Placement {
  constructor(
    readonly shape: Shape,
    readonly parent: Container,
    readonly index: number,
  ) {}

  static detach(shape: Shape): Placement {
    const parent = shape.parent as Container;
    const index = parent.remove(shape);
    return new Placement(shape, parent, index);
  }

  restore(): void {
    this.parent.insert(this.shape, this.index);
  }
}
