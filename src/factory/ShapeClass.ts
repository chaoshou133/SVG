import type { Shape } from '../model/Shape';

/** The static side every registrable shape class provides. */
export interface ShapeClass {
  readonly typeName: string;
  readonly usage: string;
  /** Builds from CLI arguments (after `<type> <id>`, without the `in` clause). */
  fromArgs(id: string, args: readonly string[]): Shape;
  /** Builds from a parsed SVG element. */
  fromAttributes(id: string, attributes: ReadonlyMap<string, string>, text: string): Shape;
}
