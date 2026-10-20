import type { Shape } from '../model/Shape';
import type { ShapeMemento } from '../model/ShapeMemento';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';

/** `move <id> <dx> <dy>` — relative translation; containers move as a whole. */
export class MoveCommand implements Command {
  private shape: Shape | null = null;
  private memento: ShapeMemento | null = null;

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
    private readonly dx: number,
    private readonly dy: number,
  ) {}

  execute(): string {
    const shape = this.doc.require(this.id);
    this.memento = shape.createMemento();
    shape.move(this.dx, this.dy);
    this.shape = shape;
    return shape.describeMove(this.dx, this.dy, false);
  }

  undo(): string {
    (this.memento as ShapeMemento).restore();
    return (this.shape as Shape).describeMove(-this.dx, -this.dy, true);
  }
}
