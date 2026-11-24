/**
 * An undoable edit operation (GoF Command pattern).
 * Both `execute` and `undo` return the human-readable CLI feedback line.
 */
export interface UndoableCommand {
  execute(): string;
  undo(): string;
}
