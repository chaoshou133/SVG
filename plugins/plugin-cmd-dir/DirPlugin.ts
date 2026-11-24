import type { Plugin } from '../../src/kernel/ext/Plugin';
import type { PluginContext } from '../../src/kernel/ext/PluginContext';
import { DirCommand } from './DirCommand';

export class DirPlugin implements Plugin {
  readonly name = '@svgframe/plugin-cmd-dir';

  activate(ctx: PluginContext): void {
    ctx.registerCommand(new DirCommand(ctx.directoryAccess));
  }
}
