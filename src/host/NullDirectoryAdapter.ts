import type { DirectoryAccess } from '../kernel/io/DirectoryAccess';
import type { DirectoryEntry } from '../kernel/io/DirectoryEntry';

/** Safe default DirectoryAccess when tests construct an editor without directory IO. */
export class NullDirectoryAdapter implements DirectoryAccess {
  currentDirectory(): string {
    return '.';
  }

  listEntries(_dirPath: string): readonly DirectoryEntry[] {
    return [];
  }
}
