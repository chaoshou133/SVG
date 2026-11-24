import { createInterface } from 'node:readline';
import { Editor } from './Editor';

/**
 * Interactive loop on stdin/stdout with the `svg>` prompt.
 * When stdin is not a terminal (a piped script), each command is echoed after
 * the prompt so the output reads like a session transcript.
 */
export class Repl {
  private static readonly PROMPT = 'svg> ';

  constructor(private readonly editor: Editor) {}

  start(): void {
    const interactive = process.stdin.isTTY === true;
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: interactive });
    rl.setPrompt(Repl.PROMPT);
    process.stdout.write(`svg-editor ${Editor.VERSION} — type 'help' for commands\n\n`);
    rl.prompt();
    rl.on('line', (line) => {
      if (!interactive) {
        process.stdout.write(`${line}\n`);
      }
      if (this.editor.execute(line)) {
        rl.prompt();
      } else {
        rl.close();
      }
    });
    rl.on('close', () => {
      if (!interactive) {
        process.stdout.write('\n');
      }
    });
  }
}
