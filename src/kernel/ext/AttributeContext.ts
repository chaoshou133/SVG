import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';

/**
 * Public read-and-access facade provided to AttributeHandler implementations
 * so they inspect target shapes and sub-parts without breaking encapsulation.
 */
export interface AttributeContext {
  readonly document: SvgDocument;
  getShape(shapeId: string): Shape;
}
