import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';
import { Command } from '../../src/kernel/ext/Command';

export class HelpHandler extends Command {
  readonly name = 'help';
  readonly usage = 'help';
  readonly summary = 'show all commands and their syntax';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    const commands = session.commands.all();
    const width = Math.max(...commands.map((command) => command.usage.length)) + 2;
    session.out.info('commands:');
    for (const command of commands) {
      session.out.info(`  ${command.usage.padEnd(width)}${command.summary}`);
    }
    session.out.info('shape types:');
    for (const usage of session.shapes.usages()) {
      session.out.info(`  ${usage}`);
    }
    session.out.info("lines starting with '#' are comments; quote arguments containing spaces.");
  }
}
