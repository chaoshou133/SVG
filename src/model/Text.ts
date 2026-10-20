import { GeometricShape } from './GeometricShape';
import type { ShapeVisitor } from './ShapeVisitor';

/** `<text>`: its content is character data, exposed to `set` as the pseudo attribute `text`. */
export class Text extends GeometricShape {
  static readonly typeName = 'text';
  static readonly usage = 'create text <id> <x> <y> "content" [in <containerId>]';
  private static readonly KEYS = ['x', 'y'];
  private static readonly CONTENT = 'text';

  private content: string;

  constructor(id: string, x: number, y: number, content: string) {
    super(id, [['x', x], ['y', y]], ['x'], ['y']);
    this.content = content;
  }

  get tagName(): string {
    return Text.typeName;
  }

  get x(): number {
    return this.num('x');
  }

  get y(): number {
    return this.num('y');
  }

  get text(): string {
    return this.content;
  }

  override textContent(): string {
    return this.content;
  }

  override settableAttributes(): string[] {
    return [...super.settableAttributes(), Text.CONTENT];
  }

  override getAttribute(name: string): string | undefined {
    return name === Text.CONTENT ? this.content : super.getAttribute(name);
  }

  override setAttribute(name: string, value: string): void {
    if (name === Text.CONTENT) {
      this.content = value;
    } else {
      super.setAttribute(name, value);
    }
  }

  override removeAttribute(name: string): void {
    if (name !== Text.CONTENT) {
      super.removeAttribute(name);
    }
  }

  override accept<R>(visitor: ShapeVisitor<R>): R {
    return visitor.visitText(this);
  }

  static fromArgs(id: string, args: readonly string[]): Text {
    Text.checkArity(args, 3, 3, Text.usage);
    const [x, y] = Text.numbers(args, 2);
    return new Text(id, x, y, args[2]);
  }

  static fromAttributes(id: string, attributes: ReadonlyMap<string, string>, content: string): Text {
    const [x, y] = Text.readGeometry(attributes, Text.KEYS);
    const text = new Text(id, x, y, content);
    text.adoptAttributes(attributes, Text.KEYS);
    return text;
  }
}
