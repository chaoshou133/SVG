import { GeometricShape } from '../../src/kernel/model/GeometricShape';
import { Num } from '../../src/kernel/model/Num';

export class Circle extends GeometricShape {
  static readonly typeName = 'circle';
  static readonly usage = 'create circle <id> <cx> <cy> <r> [fill] [in <containerId>]';
  private static readonly KEYS = ['cx', 'cy', 'r'];

  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, [['cx', cx], ['cy', cy], ['r', r]], ['cx'], ['cy']);
  }

  get tagName(): string {
    return Circle.typeName;
  }

  get cx(): number {
    return this.num('cx');
  }

  get cy(): number {
    return this.num('cy');
  }

  get r(): number {
    return this.num('r');
  }

  override summary(): string {
    return this.formatWithFill(`cx=${Num.format(this.cx)} cy=${Num.format(this.cy)} r=${Num.format(this.r)}`);
  }

  static fromArgs(id: string, args: readonly string[]): Circle {
    Circle.checkArity(args, 3, 4, Circle.usage);
    const [cx, cy, r] = Circle.numbers(args, 3);
    const circle = new Circle(id, cx, cy, r);
    if (args.length === 4) {
      circle.setAttribute('fill', args[3]);
    }
    return circle;
  }

  static fromAttributes(id: string, attributes: ReadonlyMap<string, string>): Circle {
    const [cx, cy, r] = Circle.readGeometry(attributes, Circle.KEYS);
    const circle = new Circle(id, cx, cy, r);
    circle.adoptAttributes(attributes, Circle.KEYS);
    return circle;
  }
}
