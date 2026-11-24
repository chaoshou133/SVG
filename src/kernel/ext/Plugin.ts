import type { PluginContext } from './PluginContext';

/** Contract implemented by every built-in and external plugin class/instance. */
export interface Plugin {
  readonly name: string;
  activate(ctx: PluginContext): void;
}
