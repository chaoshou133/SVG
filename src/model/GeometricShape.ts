import { GeometryMemento } from './GeometryMemento';
import { Num } from './Num';
import { Shape } from './Shape';
import type { ShapeMemento } from './ShapeMemento';

/**
 * Composite leaf: a shape described by named numeric geometry attributes.
 * Subclasses only declare which attributes exist and which of them are
 * horizontal / vertical positions; move, scale, set and snapshots are shared.
 */
export abstract class GeometricShape extends Shape {
  private readonly geometry = new Map<string, number>();

  protected constructor(
    id: string,
    geometry: readonly (readonly [string, number])[],
    private readonly xKeys: readonly string[],
    private readonly yKeys: readonly string[],
  ) {
    super(id);
    for (const [key, value] of geometry) {
      this.geometry.set(key, value);
    }
  }

  protected num(key: string): number {
    return this.geometry.get(key) as number;
  }

  /** `move` shifts the position attributes. */
  override move(dx: number, dy: number): void {
    this.shift(this.xKeys, dx);
    this.shift(this.yKeys, dy);
  }

  /** `scale` multiplies every geometry attribute (position and size), i.e. scales about the origin. */
  override scale(factor: number): void {
    for (const [key, value] of this.geometry) {
      this.geometry.set(key, value * factor);
    }
  }

  override createMemento(): ShapeMemento {
    return new GeometryMemento(this, this.geometry);
  }

  /** Called by GeometryMemento only. */
  restoreGeometry(snapshot: ReadonlyMap<string, number>): void {
    for (const [key, value] of snapshot) {
      this.geometry.set(key, value);
    }
  }

  override describeMove(_dx: number, _dy: number, back: boolean): string {
    const [x, y] = this.anchor();
    return `${this.ref()} moved${back ? ' back' : ''} to (${Num.format(x)},${Num.format(y)})`;
  }

  /** Reference point reported after a move: the first horizontal and vertical position attribute. */
  anchor(): [number, number] {
    return [this.num(this.xKeys[0]), this.num(this.yKeys[0])];
  }

  override settableAttributes(): string[] {
    return [...this.geometry.keys(), ...super.settableAttributes()];
  }

  override getAttribute(name: string): string | undefined {
    return this.geometry.has(name) ? Num.format(this.num(name)) : super.getAttribute(name);
  }

  override setAttribute(name: string, value: string): void {
    if (this.geometry.has(name)) {
      this.geometry.set(name, Num.parse(value));
    } else {
      super.setAttribute(name, value);
    }
  }

  override removeAttribute(name: string): void {
    if (!this.geometry.has(name)) {
      super.removeAttribute(name);
    }
  }

  override geometryEntries(): [string, string][] {
    return [...this.geometry].map(([key, value]) => [key, Num.format(value)]);
  }

  /** Strictly parses CLI arguments into numbers. */
  protected static numbers(args: readonly string[], count: number): number[] {
    return args.slice(0, count).map((arg) => Num.parse(arg));
  }

  /** Leniently reads geometry attributes from a parsed SVG element. */
  protected static readGeometry(attributes: ReadonlyMap<string, string>, keys: readonly string[]): number[] {
    return keys.map((key) => Num.parseLenient(attributes.get(key)));
  }

  private shift(keys: readonly string[], delta: number): void {
    for (const key of keys) {
      this.geometry.set(key, this.num(key) + delta);
    }
  }
}
