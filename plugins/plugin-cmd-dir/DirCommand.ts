import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';
import { Command } from '../../src/kernel/ext/Command';
import type { DirectoryAccess } from '../../src/kernel/io/DirectoryAccess';
import type { DirectoryEntry } from '../../src/kernel/io/DirectoryEntry';

/**
 * `dir` — lists direct entries of the process's current working directory through
 * the DirectoryAccess Adapter target interface (independent of Node.js `fs`).
 * Does not require an active SVG document and never alters document or undo history.
 */
export class DirCommand extends Command {
  readonly name = 'dir';
  readonly usage = 'dir';
  readonly summary = 'list files and subdirectories in the current working directory';

  constructor(private readonly directoryAccess: DirectoryAccess) {
    super();
  }

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    const cwd = this.directoryAccess.currentDirectory();
    const entries = this.directoryAccess
      .listEntries(cwd)
      .filter((entry) => entry.name !== '.' && entry.name !== '..');

    if (entries.length === 0) {
      session.out.info('(empty directory)');
      return;
    }

    const dirs = this.sortByName(entries.filter((e) => e.kind === 'dir'));
    const files = this.sortByName(entries.filter((e) => e.kind === 'file'));
    const links = this.sortByName(entries.filter((e) => e.kind === 'symlink'));
    const others = this.sortByName(entries.filter((e) => e.kind === 'other'));

    for (const d of dirs) {
      session.out.info(`[DIR]  ${d.name}`);
    }
    for (const f of files) {
      session.out.info(`[FILE]  ${f.name}`);
    }
    for (const l of links) {
      session.out.info(`[LINK]  ${l.name}`);
    }
    for (const o of others) {
      session.out.info(`[OTHER]  ${o.name}`);
    }
  }

  private sortByName(list: readonly DirectoryEntry[]): DirectoryEntry[] {
    return [...list].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }
}
