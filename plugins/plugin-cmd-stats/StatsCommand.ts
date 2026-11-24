import type { EditorSession } from '../../src/kernel/cli/EditorSession';
import type { Token } from '../../src/kernel/cli/Token';
import { Command } from '../../src/kernel/ext/Command';
import type { Shape } from '../../src/kernel/model/Shape';

/**
 * `stats` — depth-first shape statistics across canvas children.
 * Containers (g, box, …) increment `containers` and recurse; leaves are counted
 * by domain `typeName` in first-appearance order. Does not mutate document or undo stack.
 */
export class StatsCommand extends Command {
  readonly name = 'stats';
  readonly usage = 'stats';
  readonly summary = 'count leaf shapes by type and total containers';

  run(args: readonly Token[], session: EditorSession): void {
    this.expectArgs(args, 0);
    const doc = session.requireDocument();
    const counts = new Map<string, number>();
    let total = 0;
    let containers = 0;

    const walk = (shapes: readonly Shape[]): void => {
      for (const shape of shapes) {
        if (shape.isContainerKind()) {
          containers += 1;
          const container = shape.asContainer();
          if (container !== null) {
            walk(container.children());
          }
        } else {
          const kind = shape.typeName;
          counts.set(kind, (counts.get(kind) ?? 0) + 1);
          total += 1;
        }
      }
    };

    walk(doc.children());
    const summary = `(total ${total}, containers ${containers})`;
    if (counts.size === 0) {
      session.out.info(summary);
      return;
    }
    const parts = [...counts.entries()].map(([kind, count]) => `${kind}: ${count}`);
    session.out.info(`${parts.join('  ')}  ${summary}`);
  }
}
