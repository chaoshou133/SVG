/**
 * Port for file access, keeping IO out of the editor logic.
 * Implementations throw EditorError(`cannot read file: …` / `cannot write file: …`).
 */
export interface FileSystem {
  readText(path: string): string;
  writeText(path: string, content: string): void;
}
