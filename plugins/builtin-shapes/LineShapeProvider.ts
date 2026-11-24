import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import type { Shape } from '../../src/kernel/model/Shape';
import { Line } from './Line';

export class LineShapeProvider implements ShapeProvider {
  readonly typeName = Line.typeName;
  readonly usage = Line.usage;
  readonly svgTag = Line.typeName;

  createFromArgs(id: string, args: readonly string[], _shapes: ShapeRegistry): Shape {
    return Line.fromArgs(id, args);
  }

  createFromElement(id: string, attributes: ReadonlyMap<string, string>): Shape {
    return Line.fromAttributes(id, attributes);
  }
}
