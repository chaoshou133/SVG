import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { EditorSession } from '../kernel/cli/EditorSession';
import type { Plugin } from '../kernel/ext/Plugin';
import type { PluginManifest } from '../kernel/ext/PluginManifest';

interface PluginEntryConfig {
  readonly module: string;
  readonly enabled?: boolean;
  readonly options?: Record<string, unknown>;
}

interface PluginsConfigFile {
  readonly plugins: readonly PluginEntryConfig[];
}

/**
 * Mode B (configuration-driven) plugin loader living in the host/assembly layer.
 * Dynamically resolves and loads modules named in `plugins.config.json` without
 * hardcoding any concrete plugin imports, name maps, or branches.
 */
export class PluginLoader {
  loadFromConfigFile(configPath: string, session: EditorSession): void {
    const absConfigPath = resolve(configPath);
    const configDir = dirname(absConfigPath);
    const config = this.parseConfig(absConfigPath, session);
    if (config === null) {
      return;
    }

    for (const entry of config.plugins) {
      if (entry.enabled === false) {
        continue;
      }
      this.loadEntry(entry, configDir, session);
    }
  }

  private parseConfig(absConfigPath: string, session: EditorSession): PluginsConfigFile | null {
    try {
      const raw = readFileSync(absConfigPath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!this.isValidConfig(parsed)) {
        session.out.error('invalid plugin config');
        return null;
      }
      return parsed;
    } catch {
      session.out.error('invalid plugin config');
      return null;
    }
  }

  private isValidConfig(value: unknown): value is PluginsConfigFile {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      return false;
    }
    const obj = value as Record<string, unknown>;
    if (!Array.isArray(obj.plugins)) {
      return false;
    }
    for (const item of obj.plugins) {
      if (item === null || typeof item !== 'object' || Array.isArray(item)) {
        return false;
      }
      const entry = item as Record<string, unknown>;
      if (typeof entry.module !== 'string' || entry.module.trim() === '') {
        return false;
      }
      if (entry.enabled !== undefined && typeof entry.enabled !== 'boolean') {
        return false;
      }
      if (
        entry.options !== undefined &&
        (entry.options === null || typeof entry.options !== 'object' || Array.isArray(entry.options))
      ) {
        return false;
      }
    }
    return true;
  }

  private loadEntry(entry: PluginEntryConfig, configDir: string, session: EditorSession): void {
    const specifier = entry.module;
    let resolvedPath: string;
    try {
      resolvedPath = require.resolve(specifier, { paths: [configDir] });
    } catch {
      session.out.error(`plugin not found: ${specifier}`);
      return;
    }

    const manifest = this.readManifest(specifier, configDir, resolvedPath);
    const displayName = manifest?.name ?? specifier;

    let loadedModule: unknown;
    try {
      // Clear cached module evaluation errors only if needed; standard require loads the module.
      loadedModule = require(resolvedPath);
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      session.out.error(`plugin failed to activate: ${displayName} (${reason})`);
      return;
    }

    const plugin = this.extractDefaultPlugin(loadedModule);
    if (plugin === null) {
      session.out.error(`plugin has no default export: ${specifier}`);
      return;
    }

    session.plugins.loadPlugin(plugin, manifest, entry.options ?? {});
  }

  private extractDefaultPlugin(loadedModule: unknown): Plugin | null {
    if (loadedModule === null || typeof loadedModule !== 'object') {
      return null;
    }
    const record = loadedModule as Record<string, unknown>;
    const candidate = record.default;
    if (
      candidate === null ||
      candidate === undefined ||
      typeof candidate !== 'object' ||
      typeof (candidate as Record<string, unknown>).activate !== 'function'
    ) {
      return null;
    }
    return candidate as Plugin;
  }

  private readManifest(specifier: string, configDir: string, resolvedPath: string): PluginManifest | undefined {
    // 1. Relative path specifier: look in the target directory directly first.
    if (specifier.startsWith('./') || specifier.startsWith('../')) {
      const candidatePkg = resolve(configDir, specifier, 'package.json');
      if (existsSync(candidatePkg)) {
        return this.tryParseManifest(candidatePkg);
      }
    }
    // 2. Package specifier or file path: walk up from resolved entry until finding a package.json with contributes.
    let dir = dirname(resolvedPath);
    for (let i = 0; i < 6; i++) {
      const candidatePkg = resolve(dir, 'package.json');
      if (existsSync(candidatePkg)) {
        const parsed = this.tryParseManifest(candidatePkg);
        if (parsed !== undefined) {
          return parsed;
        }
      }
      const parent = dirname(dir);
      if (parent === dir) {
        break;
      }
      dir = parent;
    }
    return undefined;
  }

  private tryParseManifest(pkgPath: string): PluginManifest | undefined {
    try {
      const raw = JSON.parse(readFileSync(pkgPath, 'utf8')) as Record<string, unknown>;
      if (typeof raw.name !== 'string') {
        return undefined;
      }
      if (raw.contributes !== undefined && (raw.contributes === null || typeof raw.contributes !== 'object')) {
        return undefined;
      }
      return {
        name: raw.name,
        contributes: raw.contributes as PluginManifest['contributes'],
      };
    } catch {
      return undefined;
    }
  }
}
