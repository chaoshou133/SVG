/**
 * A user-facing failure. The CLI prints its message with the `error:` prefix.
 * Commands throw it before mutating anything, so a failed command never changes state.
 */
export class EditorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EditorError';
  }
}
