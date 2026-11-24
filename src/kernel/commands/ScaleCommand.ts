import { EditorError } from '../model/EditorError';
import { Num } from '../model/Num';
import type { Shape } from '../model/Shape';
import type { ShapeMemento } from '../model/ShapeMemento';
import type { SvgDocument } from '../model/SvgDocument';
import type { UndoableCommand } from './UndoableCommand';

/** `scale <id> <factor>` — scales geometry uniformly; uses Memento for exact undo. */
export class ScaleCommand implements UndoableCommand {
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
    const shape = this.shape as Shape;
    (this.memento as ShapeMemento).restore();
    return `${shape.ref()} scale by ${Num.format(this.factor)} undone`;
  }
}
