import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import type { Shape } from '../../src/kernel/model/Shape';
import { Circle } from './Circle';

export class CircleShapeProvider implements ShapeProvider {
  readonly typeName = Circle.typeName;
  readonly usage = Circle.usage;
  readonly svgTag = Circle.typeName;

  createFromArgs(id: string, args: readonly string[], _shapes: ShapeRegistry): Shape {
    return Circle.fromArgs(id, args);
  }

  createFromElement(id: string, attributes: ReadonlyMap<string, string>): Shape {
    return Circle.fromAttributes(id, attributes);
  }
}
