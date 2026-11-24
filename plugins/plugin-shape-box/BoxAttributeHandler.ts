import type { AttributeContext } from '../../src/kernel/ext/AttributeContext';
import type { AttributeHandler } from '../../src/kernel/ext/AttributeHandler';
import type { AttributeResult } from '../../src/kernel/ext/AttributeResult';
import { Box } from './Box';

/**
 * AttributeHandler implementing domain semantics of `fill` and `label` on `Box`:
 *  - `set n1 fill <color>` → propagates to inner `n1-rect`
 *  - `set n1 label "<text>"` → updates inner `n1-label` text content
 */
export class BoxAttributeHandler implements AttributeHandler {
  readonly name = 'box-attributes';
  readonly priority = 10;

  handles(shapeId: string, attr: string, ctx: AttributeContext): boolean {
    const shape = ctx.getShape(shapeId);
    return shape instanceof Box && (attr === 'fill' || attr === 'label');
  }

  apply(shapeId: string, attr: string, value: string, ctx: AttributeContext): AttributeResult {
    const box = ctx.getShape(shapeId) as Box;
    if (attr === 'fill') {
      box.setRectFill(value);
      return {
        executeMessage: `box#${box.id} fill propagated to ${box.rectChildId}`,
        undoMessage: `box#${box.id} fill restored on ${box.rectChildId}`,
      };
    }
    const previous = box.getLabelText();
    box.setLabelText(value);
    return {
      executeMessage: `box#${box.id} label updated: "${value}"`,
      undoMessage: `box#${box.id} label restored: "${previous}"`,
    };
  }
}
