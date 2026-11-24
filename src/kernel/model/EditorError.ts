/** Thrown for expected user or document errors; turned into `error:` lines by the CLI. */
export class EditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditorError';
  }
}
