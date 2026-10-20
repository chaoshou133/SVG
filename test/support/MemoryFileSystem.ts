import type { FileSystem } from '../../src/io/FileSystem';
import { EditorError } from '../../src/model/EditorError';

/** In-memory FileSystem for tests. Paths listed in `readOnly` fail on write. */
export class MemoryFileSystem implements FileSystem {
  readonly files = new Map<string, string>();
  readonly readOnly = new Set<string>();

  constructor(initial: Record<string, string> = {}) {
    for (const [path, content] of Object.entries(initial)) {
      this.files.set(path, content);
    }
  }

  readText(path: string): string {
    const content = this.files.get(path);
    if (content === undefined) {
      throw new EditorError(`cannot read file: ${path}`);
    }
    return content;
  }

  writeText(path: string, content: string): void {
    if (this.readOnly.has(path)) {
      throw new EditorError(`cannot write file: ${path}`);
    }
    this.files.set(path, content);
  }
}
