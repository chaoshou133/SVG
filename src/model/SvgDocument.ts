import { ChildList } from './ChildList';
import type { Container } from './Container';
import { EditorError } from './EditorError';
import { Num } from './Num';
import type { Shape } from './Shape';

/** The `<svg>` root: canvas size plus the top-level shapes. All id lookups go through here. */
export class SvgDocument implements Container {
  static readonly DEFAULT_WIDTH = 800;
  static readonly DEFAULT_HEIGHT = 600;

  private readonly list = new ChildList(this);
  private canvasWidth = 0;
  private canvasHeight = 0;

  constructor(width: number = SvgDocument.DEFAULT_WIDTH, height: number = SvgDocument.DEFAULT_HEIGHT) {
    this.resize(width, height);
  }

  get width(): number {
    return this.canvasWidth;
  }

  get height(): number {
    return this.canvasHeight;
  }

  resize(width: number, height: number): void {
    if (!(width > 0) || !(height > 0)) {
      throw new EditorError('canvas size must be positive');
    }
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  sizeLabel(): string {
    return `${Num.format(this.canvasWidth)}x${Num.format(this.canvasHeight)}`;
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
    return 'svg';
  }

  containerParent(): Container | null {
    return null;
  }

  isDocumentRoot(): boolean {
    return true;
  }

  // ---- lookup -----------------------------------------------------------

  /** Every shape in document order. */
  allShapes(): Shape[] {
    return this.children().flatMap((child) => child.subtree());
  }

  elementCount(): number {
    return this.allShapes().length;
  }

  find(id: string): Shape | undefined {
    return this.allShapes().find((shape) => shape.id === id);
  }

  has(id: string): boolean {
    return this.find(id) !== undefined;
  }

  require(id: string): Shape {
    const shape = this.find(id);
    if (shape === undefined) {
      throw new EditorError(`no such shape: ${id}`);
    }
    return shape;
  }

  requireNewId(id: string): void {
    if (this.has(id)) {
      throw new EditorError(`id already exists: ${id}`);
    }
  }

  requireContainer(id: string): Container {
    const shape = this.find(id);
    if (shape === undefined) {
      throw new EditorError(`no such container: ${id}`);
    }
    const container = shape.asContainer();
    if (container === null) {
      throw new EditorError(`not a container: ${id}`);
    }
    return container;
  }
}
