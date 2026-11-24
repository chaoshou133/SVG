import { EditorError } from '../model/EditorError';
import type { Command } from './Command';

/**
 * Registry of CLI Command extensions.
 * Holds zero hardcoded command implementations; both built-in commands and
 * external command plugins register here via PluginManager.
 */
export class CommandRegistry {
  private readonly commands = new Map<string, Command>();

  register(command: Command): void {
    if (this.commands.has(command.name)) {
      throw new EditorError(`duplicate registration: commands/${command.name}`);
    }
    this.commands.set(command.name, command);
  }

  has(name: string): boolean {
    return this.commands.has(name);
  }

  lookup(name: string): Command {
    const command = this.commands.get(name);
    if (command === undefined) {
      throw new EditorError(`unknown command: ${name}. type 'help' for commands`);
    }
    return command;
  }

  all(): Command[] {
    return [...this.commands.values()];
  }
}
