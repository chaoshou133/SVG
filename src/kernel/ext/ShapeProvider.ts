import type { Shape } from '../model/Shape';
import type { ShapeRegistry } from './ShapeRegistry';

/**
 * Extension Point 1 (`ShapeProvider`):
 * Registers a shape type for CLI `create`, `help`, and SVG `read` deserialization.
 */
export interface ShapeProvider {
  /** Logical shape type name, e.g. `rect`, `g`, `box`. */
  readonly typeName: string;
  /** Usage syntax shown in `help` and argument error messages. */
  readonly usage: string;
  /** SVG element tag name produced during serialization, e.g. `rect` or `g`. */
  readonly svgTag: string;
  /** Optional `data-kind` discriminator (e.g. `box` on `<g data-kind="box">`). */
  readonly dataKind?: string;

  /** Instantiates the shape (and any composite sub-parts) from CLI arguments. */
  createFromArgs(id: string, args: readonly string[], shapes: ShapeRegistry): Shape;

  /**
   * Reconstructs a shape when reading SVG XML.
   * For container shapes that specify `dataKind`, `children` holds already-parsed child shapes
   * so the provider can validate composite invariants or degrade cleanly (returning null triggers
   * fallback to the plain `svgTag` provider).
   */
  createFromElement(
    id: string,
    attributes: ReadonlyMap<string, string>,
    text: string,
    children: readonly Shape[],
    warn: (message: string) => void,
  ): Shape | null;
}
