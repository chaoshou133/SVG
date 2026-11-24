import { readFileSync, writeFileSync } from 'node:fs';
import type { FileSystem } from '../kernel/io/FileSystem';
import { EditorError } from '../kernel/model/EditorError';

/** Production FileSystem backed by Node's synchronous fs API. */
export class NodeFileSystem implements FileSystem {
  readText(path: string): string {
    try {
      return readFileSync(path, 'utf8');
    } catch {
      throw new EditorError(`cannot read file: ${path}`);
    }
  }

  writeText(path: string, content: string): void {
    try {
      writeFileSync(path, content, 'utf8');
    } catch {
      throw new EditorError(`cannot write file: ${path}`);
    }
  }
}
