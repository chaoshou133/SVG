import { ChildList } from '../../src/kernel/model/ChildList';
import { CompositeMemento } from '../../src/kernel/model/CompositeMemento';
import type { Container } from '../../src/kernel/model/Container';
import { Num } from '../../src/kernel/model/Num';
import { Shape } from '../../src/kernel/model/Shape';
import type { ShapeMemento } from '../../src/kernel/model/ShapeMemento';

/**
 * Composite: `<g>`. Geometric operations are forwarded recursively to every
 * descendant, so callers treat a group exactly like a leaf shape.
 */
export class Group extends Shape implements Container {
  static readonly typeName = 'g';
  static readonly usage = 'create g <id> [in <containerId>]';

  private readonly list = new ChildList(this);

  constructor(id: string) {
    super(id);
  }

  get tagName(): string {
    return Group.typeName;
  }

  override summary(): string {
    return '';
  }

  children(): readonly Shape[] {
    return this.list.all();
  }

  indexOf(shape: Shape): number {
    return this.list.indexOf(shape);
  }

  insert(shape: Shape, index?: number): void {
    this.list.insert(shape, index);
  }

  remove(shape: Shape): number {
    return this.list.remove(shape);
  }

  label(): string {
    return this.ref();
  }

  containerParent(): Container | null {
    return this.parent;
  }

  isDocumentRoot(): boolean {
    return false;
  }

  assertCanDetachChild(_child: Shape): void {
    // Plain groups allow any child to be detached freely.
  }

  override asContainer(): Container {
    return this;
  }

  override subtree(): Shape[] {
    return [this, ...this.children().flatMap((child) => child.subtree())];
  }

  override move(dx: number, dy: number): void {
    for (const child of this.children()) {
      child.move(dx, dy);
    }
  }

  override scale(factor: number): void {
    for (const child of this.children()) {
      child.scale(factor);
    }
  }

  override createMemento(): ShapeMemento {
    return new CompositeMemento(this.children().map((child) => child.createMemento()));
  }

  override describeMove(dx: number, dy: number, back: boolean): string {
    return `${this.ref()} moved${back ? ' back' : ''} by (${Num.format(dx)},${Num.format(dy)})`;
  }

  static fromArgs(id: string, args: readonly string[]): Group {
    Group.checkArity(args, 0, 0, Group.usage);
    return new Group(id);
  }

  static fromAttributes(id: string, attributes: ReadonlyMap<string, string>): Group {
    const group = new Group(id);
    group.adoptAttributes(attributes, []);
    return group;
  }
}
