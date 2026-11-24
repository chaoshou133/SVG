import { ChildList } from '../../src/kernel/model/ChildList';
import { CompositeMemento } from '../../src/kernel/model/CompositeMemento';
import type { Container } from '../../src/kernel/model/Container';
import { EditorError } from '../../src/kernel/model/EditorError';
import { Num } from '../../src/kernel/model/Num';
import { Shape } from '../../src/kernel/model/Shape';
import type { ShapeMemento } from '../../src/kernel/model/ShapeMemento';

/**
 * Composite plugin shape `box`: a `<g data-kind="box">` container owning an
 * essential `<id>-rect` and `<id>-label` pair while supporting arbitrary nested
 * children (`in`, `group`, `move`, `scale`, `delete`).
 */
export class Box extends Shape implements Container {
  static readonly TYPE_NAME = 'box';
  static readonly SVG_TAG = 'g';
  static readonly USAGE = 'create box <id> <x> <y> <w> <h> "<title>" [in <containerId>]';

  private readonly list = new ChildList(this);

  constructor(
    id: string,
    private readonly rectPart: Shape,
    private readonly labelPart: Shape,
  ) {
    super(id);
    this.setExtra('data-kind', Box.TYPE_NAME);
    this.list.insert(rectPart);
    this.list.insert(labelPart);
  }

  get tagName(): string {
    return Box.SVG_TAG;
  }

  override get typeName(): string {
    return Box.TYPE_NAME;
  }

  get rectChildId(): string {
    return this.rectPart.id;
  }

  get labelChildId(): string {
    return this.labelPart.id;
  }

  getRectFill(): string | undefined {
    return this.rectPart.getAttribute('fill');
  }

  setRectFill(color: string): void {
    this.rectPart.setAttribute('fill', color);
  }

  getLabelText(): string {
    return this.labelPart.getAttribute('text') ?? '';
  }

  setLabelText(text: string): void {
    this.labelPart.setAttribute('text', text);
  }

  override summary(): string {
    return '';
  }

  override canUngroup(): boolean {
    return false;
  }

  override describeCreate(targetLabel: string | null): string {
    const where = targetLabel === null ? '' : ` in ${targetLabel}`;
    return `box#${this.id} created (g#${this.id} + rect#${this.rectPart.id} + text#${this.labelPart.id})${where}`;
  }

  override describeMove(dx: number, dy: number, back: boolean): string {
    return `box#${this.id} moved${back ? ' back' : ''} by (${Num.format(dx)},${Num.format(dy)})`;
  }

  // ---- Container --------------------------------------------------------

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

  assertCanDetachChild(child: Shape): void {
    if (child === this.rectPart || child === this.labelPart) {
      throw new EditorError(`cannot detach essential child of composite shape: ${child.id} (owned by ${this.id})`);
    }
  }

  // ---- Composite operations ---------------------------------------------

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
}
