import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { ShapeProvider } from './ShapeProvider';

/**
 * Registry of ShapeProvider extensions.
 * Kernel never hardcodes any concrete shape type; both built-in shapes and
 * optional shape plugins register here through PluginManager.
 */
export class ShapeRegistry {
  private readonly byType = new Map<string, ShapeProvider>();
  private readonly byTag = new Map<string, ShapeProvider>();
  private readonly byTagAndKind = new Map<string, ShapeProvider>();

  register(provider: ShapeProvider): void {
    if (this.byType.has(provider.typeName)) {
      throw new EditorError(`duplicate registration: shapes/${provider.typeName}`);
    }
    this.byType.set(provider.typeName, provider);
    if (provider.dataKind !== undefined && provider.dataKind !== '') {
      this.byTagAndKind.set(`${provider.svgTag}::${provider.dataKind}`, provider);
    } else if (!this.byTag.has(provider.svgTag)) {
      this.byTag.set(provider.svgTag, provider);
    }
  }

  hasType(typeName: string): boolean {
    return this.byType.has(typeName);
  }

  hasTag(svgTag: string): boolean {
    return this.byTag.has(svgTag);
  }

  findForElement(svgTag: string, dataKind: string | undefined): ShapeProvider | undefined {
    if (dataKind !== undefined && dataKind !== '') {
      const specialized = this.byTagAndKind.get(`${svgTag}::${dataKind}`);
      if (specialized !== undefined) {
        return specialized;
      }
    }
    return this.byTag.get(svgTag);
  }

  findSpecialized(svgTag: string, dataKind: string | undefined): ShapeProvider | undefined {
    if (dataKind === undefined || dataKind === '') {
      return undefined;
    }
    return this.byTagAndKind.get(`${svgTag}::${dataKind}`);
  }

  usages(): string[] {
    return [...this.byType.values()].map((provider) => provider.usage);
  }

  typeNames(): string[] {
    return [...this.byType.keys()];
  }

  createFromArgs(typeName: string, id: string, args: readonly string[]): Shape {
    const provider = this.byType.get(typeName);
    if (provider === undefined) {
      throw new EditorError(`unknown shape type: ${typeName} (is the plugin loaded?)`);
    }
    return provider.createFromArgs(id, args, this);
  }
}
