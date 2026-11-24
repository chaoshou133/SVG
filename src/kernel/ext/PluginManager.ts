import type { Output } from '../cli/Output';
import type { DirectoryAccess } from '../io/DirectoryAccess';
import type { AttributeHandler } from './AttributeHandler';
import type { AttributeHandlerRegistry } from './AttributeHandlerRegistry';
import type { Command } from './Command';
import type { CommandRegistry } from './CommandRegistry';
import type { DocumentEventBus } from './DocumentEventBus';
import type { DocumentEventListener } from './DocumentEventListener';
import type { Plugin } from './Plugin';
import type { PluginContext } from './PluginContext';
import type { PluginManifest } from './PluginManifest';
import type { ShapeProvider } from './ShapeProvider';
import type { ShapeRegistry } from './ShapeRegistry';
import type { TreeDecorator } from './TreeDecorator';
import type { TreeDecoratorRegistry } from './TreeDecoratorRegistry';

class DuplicateError extends Error {
  constructor(
    readonly category: string,
    readonly itemName: string,
  ) {
    super(`duplicate registration: ${category}/${itemName}`);
  }
}

/**
 * Single unified registration, manifest-validation, and transactional rollback
 * pipeline shared by BOTH Mode A (CodeAssembly) and Mode B (PluginLoader).
 */
export class PluginManager {
  constructor(
    private readonly shapes: ShapeRegistry,
    private readonly commands: CommandRegistry,
    private readonly decorators: TreeDecoratorRegistry,
    private readonly attributes: AttributeHandlerRegistry,
    private readonly events: DocumentEventBus,
    private readonly directoryAccess: DirectoryAccess,
    private readonly out: Output,
  ) {}

  /**
   * Activates `plugin` inside a staging transaction:
   *  - Duplicate registration (against live registries or within the same plugin) → rollback + error.
   *  - Exception thrown in `activate` → rollback + error.
   *  - `manifest.contributes` mismatch → rollback + error.
   *  - All checks pass → commit all staged items atomically.
   */
  loadPlugin(
    plugin: Plugin,
    manifest?: PluginManifest,
    options: Readonly<Record<string, unknown>> = {},
  ): boolean {
    const displayName = manifest?.name || plugin.name || '(anonymous)';
    const stagedShapes: ShapeProvider[] = [];
    const stagedCommands: Command[] = [];
    const stagedDecorators: TreeDecorator[] = [];
    const stagedAttributes: AttributeHandler[] = [];
    const stagedListeners: DocumentEventListener[] = [];

    const seenShapes = new Set<string>();
    const seenCommands = new Set<string>();
    const seenDecorators = new Set<string>();
    const seenAttributes = new Set<string>();

    const ctx: PluginContext = {
      options,
      directoryAccess: this.directoryAccess,
      registerShape: (provider) => {
        if (!provider || typeof provider.typeName !== 'string' || provider.typeName === '') {
          throw new Error('invalid shape provider: missing typeName');
        }
        if (this.shapes.hasType(provider.typeName) || seenShapes.has(provider.typeName)) {
          throw new DuplicateError('shapes', provider.typeName);
        }
        seenShapes.add(provider.typeName);
        stagedShapes.push(provider);
      },
      registerCommand: (command) => {
        if (!command || typeof command.name !== 'string' || command.name === '') {
          throw new Error('invalid command: missing name');
        }
        if (this.commands.has(command.name) || seenCommands.has(command.name)) {
          throw new DuplicateError('commands', command.name);
        }
        seenCommands.add(command.name);
        stagedCommands.push(command);
      },
      registerTreeDecorator: (decorator) => {
        if (!decorator || typeof decorator.name !== 'string' || decorator.name === '') {
          throw new Error('invalid tree decorator: missing name');
        }
        if (this.decorators.has(decorator.name) || seenDecorators.has(decorator.name)) {
          throw new DuplicateError('decorators', decorator.name);
        }
        seenDecorators.add(decorator.name);
        stagedDecorators.push(decorator);
      },
      registerAttributeHandler: (handler) => {
        if (!handler || typeof handler.name !== 'string' || handler.name === '') {
          throw new Error('invalid attribute handler: missing name');
        }
        if (this.attributes.has(handler.name) || seenAttributes.has(handler.name)) {
          throw new DuplicateError('attributes', handler.name);
        }
        seenAttributes.add(handler.name);
        stagedAttributes.push(handler);
      },
      onDocumentEvent: (listener) => {
        stagedListeners.push(listener);
      },
    };

    try {
      plugin.activate(ctx);
    } catch (err) {
      if (err instanceof DuplicateError) {
        this.out.error(err.message);
      } else {
        const reason = err instanceof Error ? err.message : String(err);
        this.out.error(`plugin failed to activate: ${displayName} (${reason})`);
      }
      return false;
    }

    if (manifest !== undefined) {
      const declared = this.flattenContributes(manifest.contributes);
      const registered = this.flattenContributes({
        shapes: stagedShapes.map((s) => s.typeName),
        commands: stagedCommands.map((c) => c.name),
        decorators: stagedDecorators.map((d) => d.name),
        attributes: stagedAttributes.map((a) => a.name),
      });
      if (declared !== registered) {
        this.out.error(
          `plugin manifest mismatch: ${displayName} (declared: ${declared || 'none'}, registered: ${registered || 'none'})`,
        );
        return false;
      }
    }

    // Atomic commit
    for (const s of stagedShapes) {
      this.shapes.register(s);
    }
    for (const c of stagedCommands) {
      this.commands.register(c);
    }
    for (const d of stagedDecorators) {
      this.decorators.register(d);
    }
    for (const a of stagedAttributes) {
      this.attributes.register(a);
    }
    for (const l of stagedListeners) {
      this.events.subscribe(l);
    }
    return true;
  }

  private flattenContributes(
    contributes?: {
      readonly shapes?: readonly string[];
      readonly commands?: readonly string[];
      readonly decorators?: readonly string[];
      readonly attributes?: readonly string[];
    },
  ): string {
    const items: string[] = [];
    const categories: readonly [string, readonly string[] | undefined][] = [
      ['shapes', contributes?.shapes],
      ['commands', contributes?.commands],
      ['decorators', contributes?.decorators],
      ['attributes', contributes?.attributes],
    ];
    for (const [cat, list] of categories) {
      if (list !== undefined) {
        for (const name of [...new Set(list)].sort()) {
          items.push(`${cat}/${name}`);
        }
      }
    }
    return items.join(', ');
  }
}
