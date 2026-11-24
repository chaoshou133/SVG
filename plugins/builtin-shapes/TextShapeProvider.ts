import type { ShapeProvider } from '../../src/kernel/ext/ShapeProvider';
import type { ShapeRegistry } from '../../src/kernel/ext/ShapeRegistry';
import type { Shape } from '../../src/kernel/model/Shape';
import { Text } from './Text';

export class TextShapeProvider implements ShapeProvider {
  readonly typeName = Text.typeName;
  readonly usage = Text.usage;
  readonly svgTag = Text.typeName;

  createFromArgs(id: string, args: readonly string[], _shapes: ShapeRegistry): Shape {
    return Text.fromArgs(id, args);
  }

  createFromElement(id: string, attributes: ReadonlyMap<string, string>, text: string): Shape {
    return Text.fromAttributes(id, attributes, text);
  }
}
