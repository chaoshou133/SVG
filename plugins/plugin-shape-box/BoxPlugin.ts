import type { Plugin } from '../../src/kernel/ext/Plugin';
import type { PluginContext } from '../../src/kernel/ext/PluginContext';
import { BoxAttributeHandler } from './BoxAttributeHandler';
import { BoxShapeProvider } from './BoxShapeProvider';
import { BoxTypeDecorator } from './BoxTypeDecorator';

export class BoxPlugin implements Plugin {
  readonly name = '@svgframe/plugin-shape-box';

  activate(ctx: PluginContext): void {
    const defaultFill = typeof ctx.options.fill === 'string' && ctx.options.fill !== '' ? ctx.options.fill : '#4a90d9';
    ctx.registerShape(new BoxShapeProvider(defaultFill));
    ctx.registerAttributeHandler(new BoxAttributeHandler());
    ctx.registerTreeDecorator(new BoxTypeDecorator());
  }
}
