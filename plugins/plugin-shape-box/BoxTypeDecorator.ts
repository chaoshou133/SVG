import type { TreeDecorator } from '../../src/kernel/ext/TreeDecorator';
import type { Shape } from '../../src/kernel/model/Shape';
import type { SvgDocument } from '../../src/kernel/model/SvgDocument';
import { Box } from './Box';

/** Appends `(box)` to `Box` container lines in `tree`. */
export class BoxTypeDecorator implements TreeDecorator {
  readonly name = 'box-type-label';

  decorate(shape: Shape | null, _doc: SvgDocument): string | null {
    return shape !== null && shape.typeName === Box.TYPE_NAME ? '(box)' : null;
  }
}
