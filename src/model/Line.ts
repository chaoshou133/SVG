import { GeometricShape } from './GeometricShape';
import type { ShapeVisitor } from './ShapeVisitor';

export class Line extends GeometricShape {
  static readonly typeName = 'line';
  static readonly usage = 'create line <id> <x1> <y1> <x2> <y2> [stroke] [in <containerId>]';
  private static readonly KEYS = ['x1', 'y1', 'x2', 'y2'];

  constructor(id: string, x1: number, y1: number, x2: number, y2: number) {
    super(id, [['x1', x1], ['y1', y1], ['x2', x2], ['y2', y2]], ['x1', 'x2'], ['y1', 'y2']);
  }

  get tagName(): string {
    return Line.typeName;
  }

  get x1(): number {
    return this.num('x1');
  }

  get y1(): number {
    return this.num('y1');
  }

  get x2(): number {
    return this.num('x2');
  }

  get y2(): number {
    return this.num('y2');
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitLine(this);
  }

  static fromArgs(id: string, args: readonly string[]): Line {
    Line.checkArity(args, 4, 5, Line.usage);
    const [x1, y1, x2, y2] = Line.numbers(args, 4);
    const line = new Line(id, x1, y1, x2, y2);
    if (args.length === 5) {
      line.setAttribute('stroke', args[4]);
    }
    return line;
  }

  static fromAttributes(id: string, attributes: ReadonlyMap<string, string>): Line {
    const [x1, y1, x2, y2] = Line.readGeometry(attributes, Line.KEYS);
    const line = new Line(id, x1, y1, x2, y2);
    line.adoptAttributes(attributes, Line.KEYS);
    return line;
  }
}
