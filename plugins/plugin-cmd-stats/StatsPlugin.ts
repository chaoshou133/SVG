import type { Plugin } from '../../src/kernel/ext/Plugin';
import type { PluginContext } from '../../src/kernel/ext/PluginContext';
import { StatsCommand } from './StatsCommand';

export class StatsPlugin implements Plugin {
  readonly name = '@svgframe/plugin-cmd-stats';

  activate(ctx: PluginContext): void {
    ctx.registerCommand(new StatsCommand());
  }
}
