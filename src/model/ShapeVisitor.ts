import type { Circle } from './Circle';
import type { Ellipse } from './Ellipse';
import type { Group } from './Group';
import type { Line } from './Line';
import type { Rect } from './Rect';
import type { Text } from './Text';

/**
 * Visitor over the shape hierarchy. Lets other modules add per-type behaviour
 * (e.g. the tree summary in `view`) without type switches and without putting
 * presentation code into the model.
 */
export interface ShapeVisitor<R> {
  visitRect(shape: Rect): R;
  visitCircle(shape: Circle): R;
  visitEllipse(shape: Ellipse): R;
  visitLine(shape: Line): R;
  visitText(shape: Text): R;
  visitGroup(shape: Group): R;
}
