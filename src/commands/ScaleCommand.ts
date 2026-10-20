import { EditorError } from '../model/EditorError';
import { Num } from '../model/Num';
import type { Shape } from '../model/Shape';
import type { ShapeMemento } from '../model/ShapeMemento';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';

/** `scale <id> <factor>` — uniform scaling of all geometry; recursive for containers. */
export class ScaleCommand implements Command {
  private shape: Shape | null = null;
  private memento: ShapeMemento | null = null;

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
    private readonly factor: number,
  ) {}

  execute(): string {
    if (!(this.factor > 0)) {
      throw new EditorError('scale factor must be positive');
    }
    const shape = this.doc.require(this.id);
    this.memento = shape.createMemento();
    shape.scale(this.factor);
    this.shape = shape;
    return `${shape.ref()} scaled by ${Num.format(this.factor)}`;
  }

  undo(): string {
    (this.memento as ShapeMemento).restore();
    return `${(this.shape as Shape).ref()} scale by ${Num.format(this.factor)} undone`;
  }
}
