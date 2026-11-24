import type { DirectoryEntry } from './DirectoryEntry';

/**
 * Target interface of the Adapter pattern for the `dir` command plugin.
 * Decouples directory inspection from Node.js `fs` APIs so `dir` works identically
 * under real filesystem adapters and in-memory test doubles.
 */
export interface DirectoryAccess {
  currentDirectory(): string;
  listEntries(dirPath: string): readonly DirectoryEntry[];
}
