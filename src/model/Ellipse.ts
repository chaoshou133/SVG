import { GeometricShape } from './GeometricShape';
import type { ShapeVisitor } from './ShapeVisitor';

export class Ellipse extends GeometricShape {
  static readonly typeName = 'ellipse';
  static readonly usage = 'create ellipse <id> <cx> <cy> <rx> <ry> [fill] [in <containerId>]';
  private static readonly KEYS = ['cx', 'cy', 'rx', 'ry'];

  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, [['cx', cx], ['cy', cy], ['rx', rx], ['ry', ry]], ['cx'], ['cy']);
  }

  get tagName(): string {
    return Ellipse.typeName;
  }

  get cx(): number {
    return this.num('cx');
  }

  get cy(): number {
    return this.num('cy');
  }

  get rx(): number {
    return this.num('rx');
  }

  get ry(): number {
    return this.num('ry');
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitEllipse(this);
  }

  static fromArgs(id: string, args: readonly string[]): Ellipse {
    Ellipse.checkArity(args, 4, 5, Ellipse.usage);
    const [cx, cy, rx, ry] = Ellipse.numbers(args, 4);
    const ellipse = new Ellipse(id, cx, cy, rx, ry);
    if (args.length === 5) {
      ellipse.setAttribute('fill', args[4]);
    }
    return ellipse;
  }

  static fromAttributes(id: string, attributes: ReadonlyMap<string, string>): Ellipse {
    const [cx, cy, rx, ry] = Ellipse.readGeometry(attributes, Ellipse.KEYS);
    const ellipse = new Ellipse(id, cx, cy, rx, ry);
    ellipse.adoptAttributes(attributes, Ellipse.KEYS);
    return ellipse;
  }
}
