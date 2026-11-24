import builtinCommands from '../../plugins/builtin-commands';
import builtinShapes from '../../plugins/builtin-shapes';
import type { EditorSession } from '../kernel/cli/EditorSession';

/**
 * Loads the Phase 1 built-in plugins (6 shapes + 20 commands) through the
 * unified PluginManager pipeline. Used by both Mode A and Mode B, and also
 * provides the baseline behavior when all optional Phase 2 plugins are disabled.
 */
export class BuiltinAssembly {
  install(session: EditorSession): void {
    session.plugins.loadPlugin(builtinShapes);
    session.plugins.loadPlugin(builtinCommands);
  }
}
