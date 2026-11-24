import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import type { Shape } from '../../src/kernel/model/Shape';
import { Group } from './Group';

export class GroupShapeProvider implements ShapeProvider {
  readonly typeName = Group.typeName;
  readonly usage = Group.usage;
  readonly svgTag = Group.typeName;

  createFromArgs(id: string, args: readonly string[], _shapes: ShapeRegistry): Shape {
    return Group.fromArgs(id, args);
  }

  createFromElement(id: string, attributes: ReadonlyMap<string, string>): Shape {
    return Group.fromAttributes(id, attributes);
  }
}
