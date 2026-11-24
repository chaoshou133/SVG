import { GeometricShape } from '../../src/kernel/model/GeometricShape';
import { Num } from '../../src/kernel/model/Num';

export class Rect extends GeometricShape {
  static readonly typeName = 'rect';
  static readonly usage = 'create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]';
  private static readonly KEYS = ['x', 'y', 'width', 'height'];

  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, [['x', x], ['y', y], ['width', width], ['height', height]], ['x'], ['y']);
  }

  get tagName(): string {
    return Rect.typeName;
  }

  get x(): number {
    return this.num('x');
  }

  get y(): number {
    return this.num('y');
  }

  get width(): number {
    return this.num('width');
  }

  get height(): number {
    return this.num('height');
  }

  override summary(): string {
    return this.formatWithFill(
      `x=${Num.format(this.x)} y=${Num.format(this.y)} w=${Num.format(this.width)} h=${Num.format(this.height)}`,
    );
  }

  static fromArgs(id: string, args: readonly string[]): Rect {
    Rect.checkArity(args, 4, 5, Rect.usage);
    const [x, y, w, h] = Rect.numbers(args, 4);
    const rect = new Rect(id, x, y, w, h);
    if (args.length === 5) {
      rect.setAttribute('fill', args[4]);
    }
    return rect;
  }

  static fromAttributes(id: string, attributes: ReadonlyMap<string, string>): Rect {
    const [x, y, w, h] = Rect.readGeometry(attributes, Rect.KEYS);
    const rect = new Rect(id, x, y, w, h);
    rect.adoptAttributes(attributes, Rect.KEYS);
    return rect;
  }
}
