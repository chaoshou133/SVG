import { GeometryMemento } from './GeometryMemento';
import { Num } from './Num';
import { Shape } from './Shape';
import type { ShapeMemento } from './ShapeMemento';
import type { ShapeStateSnapshot } from './ShapeStateSnapshot';

/**
 * Shared implementation for all leaf shapes whose geometry is a fixed map of
 * named numeric coordinates/dimensions.
 */
export abstract class GeometricShape extends Shape {
  private readonly geometry: Map<string, number>;
  private readonly keys: readonly string[];

  protected constructor(
    id: string,
    entries: readonly [string, number][],
    private readonly xKeys: readonly string[],
    private readonly yKeys: readonly string[],
  ) {
    super(id);
    this.geometry = new Map(entries);
    this.keys = entries.map(([key]) => key);
  }

  protected num(key: string): number {
    return this.geometry.get(key) as number;
  }

  protected formatWithFill(geometrySummary: string): string {
    const fill = this.getAttribute('fill');
    return fill === undefined ? geometrySummary : `${geometrySummary} fill=${fill}`;
  }

  override move(dx: number, dy: number): void {
    for (const key of this.xKeys) {
      this.geometry.set(key, this.num(key) + dx);
    }
    for (const key of this.yKeys) {
      this.geometry.set(key, this.num(key) + dy);
    }
  }

  override scale(factor: number): void {
    for (const key of this.keys) {
      this.geometry.set(key, this.num(key) * factor);
    }
  }

  override createMemento(): ShapeMemento {
    return new GeometryMemento(this.geometry, this.geometry.entries());
  }

  override snapshotState(): ShapeStateSnapshot {
    const base = super.snapshotState();
    const geom = this.createMemento();
    return {
      restore: () => {
        base.restore();
        geom.restore();
      },
    };
  }

  override describeMove(_dx: number, _dy: number, back: boolean): string {
    const x = Num.format(this.num(this.xKeys[0]));
    const y = Num.format(this.num(this.yKeys[0]));
    return `${this.ref()} moved${back ? ' back' : ''} to (${x},${y})`;
  }

  override settableAttributes(): string[] {
    return [...super.settableAttributes(), ...this.keys];
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
    return this.keys.map((key) => [key, Num.format(this.num(key))]);
  }

  protected static numbers(args: readonly string[], count: number): number[] {
    return args.slice(0, count).map((raw) => Num.parse(raw));
  }

  protected static readGeometry(attributes: ReadonlyMap<string, string>, keys: readonly string[]): number[] {
    return keys.map((key) => Num.parseLenient(attributes.get(key)));
  }
}
