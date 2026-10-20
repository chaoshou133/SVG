import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';
import { Placement } from './Placement';

/**
 * `front <id>` / `back <id>` — reorders a shape among its siblings.
 * SVG paints later siblings on top, so "front" means last child.
 */
export class ZOrderCommand implements Command {
  private placement: Placement | null = null;

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
    private readonly toFront: boolean,
  ) {}

  execute(): string {
    const shape = this.doc.require(this.id);
    const placement = Placement.detach(shape);
    placement.parent.insert(shape, this.toFront ? undefined : 0);
    this.placement = placement;
    return `${shape.ref()} ${this.toFront ? 'brought to front' : 'sent to back'}`;
  }

  undo(): string {
    const placement = this.placement as Placement;
    placement.parent.remove(placement.shape);
    placement.restore();
    return `${placement.shape.ref()} z-order restored`;
  }
}
