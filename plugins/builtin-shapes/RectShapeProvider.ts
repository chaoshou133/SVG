import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import type { Shape } from '../../src/kernel/model/Shape';
import { Rect } from './Rect';

export class RectShapeProvider implements ShapeProvider {
  readonly typeName = Rect.typeName;
  readonly usage = Rect.usage;
  readonly svgTag = Rect.typeName;

  createFromArgs(id: string, args: readonly string[], _shapes: ShapeRegistry): Shape {
    return Rect.fromArgs(id, args);
  }

  createFromElement(id: string, attributes: ReadonlyMap<string, string>): Shape {
    return Rect.fromAttributes(id, attributes);
  }
}
