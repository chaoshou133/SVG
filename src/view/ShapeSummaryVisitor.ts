import type { Circle } from '../model/Circle';
import type { Ellipse } from '../model/Ellipse';
import type { Group } from '../model/Group';
import type { Line } from '../model/Line';
import { Num } from '../model/Num';
import type { Rect } from '../model/Rect';
import type { Shape } from '../model/Shape';
import type { ShapeVisitor } from '../model/ShapeVisitor';
import type { Text } from '../model/Text';

/** Visitor producing the inline geometry shown next to each node in `tree`. */
export class ShapeSummaryVisitor implements ShapeVisitor<string> {
  visitRect(shape: Rect): string {
    return this.withFill(shape, `x=${f(shape.x)} y=${f(shape.y)} w=${f(shape.width)} h=${f(shape.height)}`);
  }

  visitCircle(shape: Circle): string {
    return this.withFill(shape, `cx=${f(shape.cx)} cy=${f(shape.cy)} r=${f(shape.r)}`);
  }

  visitEllipse(shape: Ellipse): string {
    return this.withFill(shape, `cx=${f(shape.cx)} cy=${f(shape.cy)} rx=${f(shape.rx)} ry=${f(shape.ry)}`);
  }

  visitLine(shape: Line): string {
    return `(${f(shape.x1)},${f(shape.y1)}) -> (${f(shape.x2)},${f(shape.y2)})`;
  }

  visitText(shape: Text): string {
    return `(${f(shape.x)},${f(shape.y)}) "${shape.text}"`;
  }

  visitGroup(_shape: Group): string {
    return '';
  }

  private withFill(shape: Shape, geometry: string): string {
    const fill = shape.getAttribute('fill');
    return fill === undefined ? geometry : `${geometry} fill=${fill}`;
  }
}

function f(value: number): string {
  return Num.format(value);
}
