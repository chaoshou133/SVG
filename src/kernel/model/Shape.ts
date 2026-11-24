import type { Container } from './Container';
import { EditorError } from './EditorError';
import { Num } from './Num';
import type { ShapeMemento } from './ShapeMemento';
import type { ShapeStateSnapshot } from './ShapeStateSnapshot';

/**
 * Composite component: the common abstraction of leaf shapes and containers.
 * Every kernel command, renderer, and plugin talks to Shape polymorphically
 * without knowing concrete shape classes.
 */
export abstract class Shape {
  private static readonly STYLE_ATTRIBUTES: readonly string[] = ['fill', 'stroke', 'stroke-width'];

  private parentContainer: Container | null = null;
  private readonly styles = new Map<string, string>();
  /** Attributes read from a file that the editor does not model (e.g. transform). Preserved on save. */
  private readonly extras = new Map<string, string>();

  protected constructor(readonly id: string) {}

  /** SVG element tag name used in XML serialization and tree refs, e.g. `rect` or `g`. */
  abstract get tagName(): string;

  /** Domain shape type name (defaults to `tagName`; composite plugins e.g. `box` override). */
  get typeName(): string {
    return this.tagName;
  }

  abstract move(dx: number, dy: number): void;
  abstract scale(factor: number): void;
  abstract createMemento(): ShapeMemento;
  /** Feedback line for `move` / its undo, e.g. `circle#c1 moved to (130,100)`. */
  abstract describeMove(dx: number, dy: number, back: boolean): string;
  /** Inline summary printed next to the node in `tree` (replaces closed ShapeVisitor for OCP). */
  abstract summary(): string;

  ref(): string {
    return `${this.tagName}#${this.id}`;
  }

  /** Creation feedback message; composite shapes like `box` override to show sub-parts. */
  describeCreate(targetLabel: string | null): string {
    const where = targetLabel === null ? '' : ` in ${targetLabel}`;
    return `${this.ref()} created${where}`;
  }

  /** Whether `ungroup` is permitted on this container (false for plugin-owned composites like `box`). */
  canUngroup(): boolean {
    return true;
  }

  /** True for container-kind shapes (`g`, `box`, etc.) counted as containers rather than leaves. */
  isContainerKind(): boolean {
    return this.asContainer() !== null;
  }

  get parent(): Container | null {
    return this.parentContainer;
  }

  /** Only ChildList calls this, keeping parent pointers consistent with child lists. */
  attachTo(container: Container | null): void {
    this.parentContainer = container;
  }

  /** Non-null for shapes that can hold children. */
  asContainer(): Container | null {
    return null;
  }

  /** This shape followed by all its descendants in document order. */
  subtree(): Shape[] {
    return [this];
  }

  isAncestorOf(other: Shape): boolean {
    const self = this.asContainer();
    if (self === null) {
      return false;
    }
    for (let p = other.parent; p !== null; p = p.containerParent()) {
      if (p === self) {
        return true;
      }
    }
    return false;
  }

  // ---- transactional state snapshot (for AttributeHandler rollback & undo) ---

  /** Captures mutable styles, extras, and subclass state for atomic rollback/undo. */
  snapshotState(): ShapeStateSnapshot {
    const savedStyles = new Map(this.styles);
    const savedExtras = new Map(this.extras);
    return {
      restore: () => {
        this.styles.clear();
        for (const [k, v] of savedStyles) {
          this.styles.set(k, v);
        }
        this.extras.clear();
        for (const [k, v] of savedExtras) {
          this.extras.set(k, v);
        }
      },
    };
  }

  // ---- attributes -------------------------------------------------------

  /** Whitelist for the `set` command. Subclasses extend it with their geometry. */
  settableAttributes(): string[] {
    return [...Shape.STYLE_ATTRIBUTES];
  }

  getAttribute(name: string): string | undefined {
    this.requireSettable(name);
    return this.styles.get(name);
  }

  setAttribute(name: string, value: string): void {
    this.requireSettable(name);
    if (name === 'stroke-width') {
      Num.parse(value);
    }
    this.styles.set(name, value);
  }

  /** Used by undo when the attribute did not exist before `set`. */
  removeAttribute(name: string): void {
    this.requireSettable(name);
    this.styles.delete(name);
  }

  /** Style attributes in canonical order (fill, stroke, stroke-width). */
  styleEntries(): [string, string][] {
    return Shape.STYLE_ATTRIBUTES.filter((name) => this.styles.has(name)).map((name) => [name, this.styles.get(name) as string]);
  }

  extraEntries(): [string, string][] {
    return [...this.extras.entries()];
  }

  protected setExtra(name: string, value: string): void {
    this.extras.set(name, value);
  }

  /** All attributes in serialization order: id, geometry, style, preserved extras. */
  svgAttributes(): [string, string][] {
    return [['id', this.id], ...this.geometryEntries(), ...this.styleEntries(), ...this.extraEntries()];
  }

  /** Geometry attributes as formatted strings; empty for groups. */
  geometryEntries(): [string, string][] {
    return [];
  }

  /** Character data of the element, null for elements without text. */
  textContent(): string | null {
    return null;
  }

  /**
   * Takes over attributes read from a file. Style attributes are modelled,
   * everything else (except id and the names in `consumed`) is kept verbatim.
   */
  adoptAttributes(attributes: ReadonlyMap<string, string>, consumed: readonly string[]): void {
    for (const [name, value] of attributes) {
      if (name === 'id' || consumed.includes(name)) {
        continue;
      }
      if (Shape.STYLE_ATTRIBUTES.includes(name)) {
        this.styles.set(name, value);
      } else {
        this.extras.set(name, value);
      }
    }
  }

  protected static checkArity(args: readonly string[], min: number, max: number, usage: string): void {
    if (args.length < min || args.length > max) {
      throw new EditorError(`usage: ${usage}`);
    }
  }

  private requireSettable(name: string): void {
    if (!this.settableAttributes().includes(name)) {
      throw new EditorError(`unknown attribute: ${name}`);
    }
  }
}
