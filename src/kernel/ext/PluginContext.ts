import type { DirectoryAccess } from '../io/DirectoryAccess';
import type { AttributeHandler } from './AttributeHandler';
import type { Command } from './Command';
import type { DocumentEventListener } from './DocumentEventListener';
import type { ShapeProvider } from './ShapeProvider';

/**
 * Facade passed to `plugin.activate(ctx)` during both Mode A and Mode B loading.
 * All register* calls are staged by PluginManager and committed atomically only
 * after activation and manifest verification succeed.
 */
export interface PluginContext {
  readonly options: Readonly<Record<string, unknown>>;
  readonly directoryAccess: DirectoryAccess;
  registerShape(provider: ShapeProvider): void;
  registerCommand(command: Command): void;
  registerTreeDecorator(decorator: import('./TreeDecorator').TreeDecorator): void;
  registerAttributeHandler(handler: AttributeHandler): void;
  onDocumentEvent(listener: DocumentEventListener): void;
}
