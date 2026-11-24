import { ConsoleOutput } from '../kernel/cli/ConsoleOutput';
import { Editor } from '../kernel/cli/Editor';
import { EditorSession } from '../kernel/cli/EditorSession';
import type { Output } from '../kernel/cli/Output';
import { Repl } from '../kernel/cli/Repl';
import type { DirectoryAccess } from '../kernel/io/DirectoryAccess';
import type { FileSystem } from '../kernel/io/FileSystem';
import { BuiltinAssembly } from './BuiltinAssembly';
import { CodeAssembly } from './CodeAssembly';
import { NodeDirectoryAdapter } from './NodeDirectoryAdapter';
import { NodeFileSystem } from './NodeFileSystem';
import { PluginLoader } from './PluginLoader';

/**
 * Composition root factory supporting:
 *  - Mode A (default): CodeAssembly
 *  - Mode B (`--config <path>`): BuiltinAssembly + PluginLoader
 *  - Baseline (`--no-plugins`): BuiltinAssembly only (Phase 1 compatibility)
 */
export class AppBootstrap {
  createEditor(
    argv: readonly string[] = [],
    fs: FileSystem = new NodeFileSystem(),
    out: Output = new ConsoleOutput(),
    directoryAccess: DirectoryAccess = new NodeDirectoryAdapter(),
  ): Editor {
    const session = new EditorSession(fs, out, directoryAccess);
    const configIndex = argv.indexOf('--config');
    if (argv.includes('--no-plugins')) {
      new BuiltinAssembly().install(session);
    } else if (configIndex !== -1) {
      new BuiltinAssembly().install(session);
      const configPath = argv[configIndex + 1];
      if (configPath === undefined || configPath.trim() === '') {
        out.error('invalid plugin config');
      } else {
        new PluginLoader().loadFromConfigFile(configPath, session);
      }
    } else {
      new CodeAssembly().install(session);
    }
    return new Editor(session);
  }

  run(argv: readonly string[] = process.argv.slice(2)): void {
    const editor = this.createEditor(argv);
    new Repl(editor).start();
  }
}
