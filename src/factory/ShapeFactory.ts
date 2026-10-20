import { Circle } from '../model/Circle';
import { EditorError } from '../model/EditorError';
import { Ellipse } from '../model/Ellipse';
import { Group } from '../model/Group';
import { Line } from '../model/Line';
import { Rect } from '../model/Rect';
import type { Shape } from '../model/Shape';
import { Text } from '../model/Text';
import type { ShapeClass } from './ShapeClass';

/**
 * Factory: type name → shape class.
 *
 * TODO(refactor, Phase 2): this is one of the two permitted by-name dispatch
 * points. The built-in types are registered here by hand; Phase 2 replaces the
 * hard-coded list with ShapeProvider plugins calling `register`.
 */
export class ShapeFactory {
  private static readonly BUILT_IN: readonly ShapeClass[] = [Rect, Circle, Ellipse, Line, Text, Group];

  private readonly types = new Map<string, ShapeClass>();

  constructor() {
    for (const type of ShapeFactory.BUILT_IN) {
      this.register(type);
    }
  }

  register(type: ShapeClass): void {
    this.types.set(type.typeName, type);
  }

  has(typeName: string): boolean {
    return this.types.has(typeName);
  }

  usages(): string[] {
    return [...this.types.values()].map((type) => type.usage);
  }

  createFromArgs(typeName: string, id: string, args: readonly string[]): Shape {
    const type = this.types.get(typeName);
    if (type === undefined) {
      throw new EditorError(`unknown shape type: ${typeName} (is the plugin loaded?)`);
    }
    return type.fromArgs(id, args);
  }

  /** Returns null for SVG elements no registered type handles. */
  createFromElement(tagName: string, id: string, attributes: ReadonlyMap<string, string>, text: string): Shape | null {
    const type = this.types.get(tagName);
    return type === undefined ? null : type.fromAttributes(id, attributes, text);
  }
}
