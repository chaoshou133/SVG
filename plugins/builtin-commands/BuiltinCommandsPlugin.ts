import type { Plugin } from '../../src/kernel/ext/Plugin';
import type { PluginContext } from '../../src/kernel/ext/PluginContext';
import { AddToHandler } from './AddToHandler';
import { CanvasHandler } from './CanvasHandler';
import { CreateHandler } from './CreateHandler';
import { DeleteHandler } from './DeleteHandler';
import { ExitHandler } from './ExitHandler';
import { GroupHandler } from './GroupHandler';
import { HelpHandler } from './HelpHandler';
import { InitHandler } from './InitHandler';
import { MoveHandler } from './MoveHandler';
import { ReadHandler } from './ReadHandler';
import { RedoHandler } from './RedoHandler';
import { SaveHandler } from './SaveHandler';
import { ScaleHandler } from './ScaleHandler';
import { SetHandler } from './SetHandler';
import { ShowHandler } from './ShowHandler';
import { TreeHandler } from './TreeHandler';
import { UndoHandler } from './UndoHandler';
import { UngroupHandler } from './UngroupHandler';
import { ZOrderHandler } from './ZOrderHandler';

export class BuiltinCommandsPlugin implements Plugin {
  readonly name = '@svgframe/builtin-commands';

  activate(ctx: PluginContext): void {
    const all = [
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
      new HelpHandler(),
      new ExitHandler(),
    ];
    for (const command of all) {
      ctx.registerCommand(command);
    }
  }
}
