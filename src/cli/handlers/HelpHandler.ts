import { CliCommand } from '../CliCommand';
import type { EditorSession } from '../EditorSession';
import type { Token } from '../Token';

export class HelpHandler extends CliCommand {
  readonly name = 'help';
  readonly usage = 'help';
  readonly summary = 'show all commands and their syntax';

  constructor(private readonly commands: () => readonly CliCommand[]) {
    super();
  }

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    const commands = this.commands();
    const width = Math.max(...commands.map((command) => command.usage.length)) + 2;
    session.out.info('commands:');
    for (const command of commands) {
      session.out.info(`  ${command.usage.padEnd(width)}${command.summary}`);
    }
    session.out.info('shape types:');
    for (const usage of session.factory.usages()) {
      session.out.info(`  ${usage}`);
    }
    session.out.info("lines starting with '#' are comments; quote arguments containing spaces.");
  }
}
