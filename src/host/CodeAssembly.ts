import type { EditorSession } from '../kernel/cli/EditorSession';
import { BuiltinAssembly } from './BuiltinAssembly';

/**
 * Mode A (code-level composition root):
 * Wires built-in plugins and any explicitly imported optional plugins through
 * the exact same PluginManager pipeline used by Mode B (PluginLoader).
 */
export class CodeAssembly {
  private readonly builtins = new BuiltinAssembly();

  install(session: EditorSession): void {
    this.builtins.install(session);
  }
}
