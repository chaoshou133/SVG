import type { Plugin } from '../../src/kernel/ext/Plugin';
import type { PluginContext } from '../../src/kernel/ext/PluginContext';
import { ModifiedStarDecorator } from './ModifiedStarDecorator';

export class ModifiedStarPlugin implements Plugin {
  readonly name = '@svgframe/plugin-tree-star';

  activate(ctx: PluginContext): void {
    const decorator = new ModifiedStarDecorator();
    ctx.registerTreeDecorator(decorator);
    ctx.onDocumentEvent(decorator);
  }
}
