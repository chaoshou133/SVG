import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import type { Shape } from '../../src/kernel/model/Shape';
import { Ellipse } from './Ellipse';

export class EllipseShapeProvider implements ShapeProvider {
  readonly typeName = Ellipse.typeName;
  readonly usage = Ellipse.usage;
  readonly svgTag = Ellipse.typeName;

  createFromArgs(id: string, args: readonly string[], _shapes: ShapeRegistry): Shape {
    return Ellipse.fromArgs(id, args);
  }

  createFromElement(id: string, attributes: ReadonlyMap<string, string>): Shape {
    return Ellipse.fromAttributes(id, attributes);
  }
}
