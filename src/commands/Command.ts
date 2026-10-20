/**
 * Command pattern: one undoable editing operation = one undo unit.
 *
 * `execute` validates everything before changing the model and throws an
 * EditorError otherwise, so a failed command leaves no trace. It is also used
 * for redo. Both methods return the feedback line shown to the user.
 */
export interface Command {
  execute(): string;
  undo(): string;
}
