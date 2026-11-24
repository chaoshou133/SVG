import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import { EditorError } from '../../src/kernel/model/EditorError';
import { Num } from '../../src/kernel/model/Num';
import type { Shape } from '../../src/kernel/model/Shape';
import { Box } from './Box';

/**
 * ShapeProvider for composite `box`.
 * Delegates inner `rect` and `text` instantiation to ShapeRegistry so this
 * plugin has zero compile-time dependency on `builtin-shapes`.
 */
export class BoxShapeProvider implements ShapeProvider {
  readonly typeName = Box.TYPE_NAME;
  readonly usage = Box.USAGE;
  readonly svgTag = Box.SVG_TAG;
  readonly dataKind = Box.TYPE_NAME;

  constructor(private readonly defaultFill: string = '#4a90d9') {}

  createFromArgs(id: string, args: readonly string[], shapes: ShapeRegistry): Shape {
    if (args.length !== 5) {
      throw new EditorError(`usage: ${Box.USAGE}`);
    }
    const x = Num.parse(args[0]);
    const y = Num.parse(args[1]);
    const w = Num.parse(args[2]);
    const h = Num.parse(args[3]);
    const title = args[4];

    const rect = shapes.createFromArgs('rect', `${id}-rect`, [
      Num.format(x),
      Num.format(y),
      Num.format(w),
      Num.format(h),
      this.defaultFill,
    ]);
    const textX = x + 20;
    const textY = y + h / 2 + 5;
    const label = shapes.createFromArgs('text', `${id}-label`, [
      Num.format(textX),
      Num.format(textY),
      title,
    ]);
    return new Box(id, rect, label);
  }

  /**
   * Restores a `Box` from `<g id="..." data-kind="box">`.
   * If essential sub-parts (`<id>-rect` as rect and `<id>-label` as text) are
   * missing or have wrong types, emits a warning and returns `null` so SvgReader
   * degrades cleanly to a plain `<g>` without producing a broken Box.
   */
  createFromElement(
    id: string,
    attributes: ReadonlyMap<string, string>,
    _text: string,
    children: readonly Shape[],
    warn: (message: string) => void,
  ): Shape | null {
    const rectId = `${id}-rect`;
    const labelId = `${id}-label`;
    const rectPart = children.find((c) => c.id === rectId && c.tagName === 'rect');
    const labelPart = children.find((c) => c.id === labelId && c.tagName === 'text');
    if (rectPart === undefined || labelPart === undefined) {
      warn(`invalid box structure on g#${id}: missing required ${rectId} or ${labelId}, degrading to plain g`);
      return null;
    }

    const box = new Box(id, rectPart, labelPart);
    box.adoptAttributes(attributes, ['data-kind']);
    for (const child of children) {
      if (child !== rectPart && child !== labelPart) {
        box.insert(child);
      }
    }
    return box;
  }
}
