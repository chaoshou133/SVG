import { EditorError } from '../model/EditorError';
import type { Command } from './Command';

/**
 * Invoker of the Command pattern: owns the undo and redo stacks.
 *
 * - a new edit clears the redo stack;
 * - after a document-level IO command (init / read / save / canvas resize)
 *   both stacks are cleared and undo/redo report an error until the next edit.
 */
export class CommandHistory {
  private readonly undoStack: Command[] = [];
  private readonly redoStack: Command[] = [];
  private ioLocked = false;

  execute(command: Command): string {
    const message = command.execute();
    this.undoStack.push(command);
    this.redoStack.length = 0;
    this.ioLocked = false;
    return message;
  }

  undo(): string {
    this.requireUnlocked('undo');
    const command = this.undoStack.pop();
    if (command === undefined) {
      throw new EditorError('nothing to undo');
    }
    const message = command.undo();
    this.redoStack.push(command);
    return message;
  }

  redo(): string {
    this.requireUnlocked('redo');
    const command = this.redoStack.pop();
    if (command === undefined) {
      throw new EditorError('nothing to redo');
    }
    const message = command.execute();
    this.undoStack.push(command);
    return message;
  }

  /** Called after IO commands: forgets history and blocks undo/redo until the next edit. */
  lockAfterIo(): void {
    this.undoStack.length = 0;
    this.redoStack.length = 0;
    this.ioLocked = true;
  }

  canUndo(): boolean {
    return !this.ioLocked && this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return !this.ioLocked && this.redoStack.length > 0;
  }

  private requireUnlocked(action: string): void {
    if (this.ioLocked) {
      throw new EditorError(`${action} not allowed after io command`);
    }
  }
}
