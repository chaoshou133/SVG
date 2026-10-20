import { EditorError } from '../model/EditorError';
import type { CliCommand } from './CliCommand';
import { AddToHandler } from './handlers/AddToHandler';
import { CanvasHandler } from './handlers/CanvasHandler';
import { CreateHandler } from './handlers/CreateHandler';
import { DeleteHandler } from './handlers/DeleteHandler';
import { ExitHandler } from './handlers/ExitHandler';
import { GroupHandler } from './handlers/GroupHandler';
import { HelpHandler } from './handlers/HelpHandler';
import { InitHandler } from './handlers/InitHandler';
import { MoveHandler } from './handlers/MoveHandler';
import { ReadHandler } from './handlers/ReadHandler';
import { RedoHandler } from './handlers/RedoHandler';
import { SaveHandler } from './handlers/SaveHandler';
import { ScaleHandler } from './handlers/ScaleHandler';
import { SetHandler } from './handlers/SetHandler';
import { ShowHandler } from './handlers/ShowHandler';
import { TreeHandler } from './handlers/TreeHandler';
import { UndoHandler } from './handlers/UndoHandler';
import { UngroupHandler } from './handlers/UngroupHandler';
import { ZOrderHandler } from './handlers/ZOrderHandler';

/**
 * Command name → handler.
 *
 * TODO(refactor): one of the two permitted by-name dispatch points. The
 * standard command set is wired by hand in `standard()`; a later phase can let
 * plugins register additional commands through `register`.
 */
export class CommandRegistry {
  private readonly commands = new Map<string, CliCommand>();

  static standard(): CommandRegistry {
    const registry = new CommandRegistry();
    const all: CliCommand[] = [
      new InitHandler(),
      new ReadHandler(),
      new SaveHandler(),
      new CanvasHandler(),
      new CreateHandler(),
      new DeleteHandler(),
      new MoveHandler(),
      new ScaleHandler(),
      new SetHandler(),
      new GroupHandler(),
      new UngroupHandler(),
      new AddToHandler(),
      new ZOrderHandler('front', true),
      new ZOrderHandler('back', false),
      new TreeHandler(),
      new ShowHandler(),
      new UndoHandler(),
      new RedoHandler(),
      new HelpHandler(() => registry.all()),
      new ExitHandler(),
    ];
    all.forEach((command) => registry.register(command));
    return registry;
  }

  register(command: CliCommand): void {
    this.commands.set(command.name, command);
  }

  lookup(name: string): CliCommand {
    const command = this.commands.get(name);
    if (command === undefined) {
      throw new EditorError(`unknown command: ${name}. type 'help' for commands`);
    }
    return command;
  }

  all(): CliCommand[] {
    return [...this.commands.values()];
  }
}
