import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';

/**
 * Extension Point 3 (`TreeDecorator`):
 * Appends trailing labels to lines produced by TreeRenderer without altering
 * the renderer or kernel. `shape === null` represents the `svg (WxH)` root row.
 */
export interface TreeDecorator {
  readonly name: string;
  decorate(shape: Shape | null, doc: SvgDocument): string | null;
}
