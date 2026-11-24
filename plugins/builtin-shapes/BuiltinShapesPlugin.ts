import type { Plugin } from '../../src/kernel/ext/Plugin';
import type { PluginContext } from '../../src/kernel/ext/PluginContext';
import { CircleShapeProvider } from './CircleShapeProvider';
import { EllipseShapeProvider } from './EllipseShapeProvider';
import { GroupShapeProvider } from './GroupShapeProvider';
import { LineShapeProvider } from './LineShapeProvider';
import { RectShapeProvider } from './RectShapeProvider';
import { TextShapeProvider } from './TextShapeProvider';

export class BuiltinShapesPlugin implements Plugin {
  readonly name = '@svgframe/builtin-shapes';

  activate(ctx: PluginContext): void {
    ctx.registerShape(new RectShapeProvider());
    ctx.registerShape(new CircleShapeProvider());
    ctx.registerShape(new EllipseShapeProvider());
    ctx.registerShape(new LineShapeProvider());
    ctx.registerShape(new TextShapeProvider());
    ctx.registerShape(new GroupShapeProvider());
  }
}
