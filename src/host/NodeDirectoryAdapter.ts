import { readdirSync } from 'node:fs';
import type { DirectoryAccess } from '../kernel/io/DirectoryAccess';
import { DirectoryEntry } from '../kernel/io/DirectoryEntry';
import { EditorError } from '../kernel/model/EditorError';

/**
 * Adapter (GoF Adapter pattern) wrapping Node.js `fs.readdirSync` and `process.cwd`
 * (Adaptee) behind the kernel's `DirectoryAccess` Target interface.
 */
export class NodeDirectoryAdapter implements DirectoryAccess {
  constructor(private readonly cwdProvider: () => string = () => process.cwd()) {}

  currentDirectory(): string {
    return this.cwdProvider();
  }

  listEntries(dirPath: string): readonly DirectoryEntry[] {
    try {
      const dirents = readdirSync(dirPath, { withFileTypes: true });
      return dirents.map((entry) => {
        if (entry.isSymbolicLink()) {
          return new DirectoryEntry(entry.name, 'symlink');
        }
        if (entry.isDirectory()) {
          return new DirectoryEntry(entry.name, 'dir');
        }
        if (entry.isFile()) {
          return new DirectoryEntry(entry.name, 'file');
        }
        return new DirectoryEntry(entry.name, 'other');
      });
    } catch {
      throw new EditorError(`cannot read directory: ${dirPath}`);
    }
  }
}
