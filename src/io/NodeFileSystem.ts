import { readFileSync, writeFileSync } from 'node:fs';
import { EditorError } from '../model/EditorError';
import type { FileSystem } from './FileSystem';

/** FileSystem backed by the real disk (UTF-8). */
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
