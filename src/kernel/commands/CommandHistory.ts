import { EditorError } from '../model/EditorError';
import type { UndoableCommand } from './UndoableCommand';

/**
 * Invoker of the Command pattern: owns the undo and redo stacks.
 */
export class CommandHistory {
  private readonly undoStack: UndoableCommand[] = [];
  private readonly redoStack: UndoableCommand[] = [];
  private ioLocked = false;

  execute(command: UndoableCommand): string {
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
