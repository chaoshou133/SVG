import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';

/**
 * Executable Phase 2 architecture rules:
 *  - Kernel (`src/kernel`) never depends on `src/host` or `plugins`.
 *  - Plugins (`plugins/*`) depend ONLY on `src/kernel` public abstractions, never on `src/host` or sibling plugins.
 *  - `src/host/PluginLoader.ts` never hardcodes concrete plugin imports or switches.
 *  - Zero external runtime dependencies (only `node:*`).
 *  - One exported class or interface per source file (excluding `main.ts` and `index.ts`).
 *  - Zero `switch` statements.
 */
const ROOT = resolve(__dirname, '..', '..');
const SRC = join(ROOT, 'src');
const PLUGINS = join(ROOT, 'plugins');

const KERNEL_ALLOWED: Readonly<Record<string, readonly string[]>> = {
  model: [],
  io: ['model', 'ext'],
  ext: ['model', 'io', 'cli'],
  commands: ['model', 'ext'],
  view: ['model', 'ext'],
  cli: ['model', 'commands', 'io', 'ext'],
};

function tsFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === 'node_modules' || entry.name === 'dist' ? [] : tsFiles(path);
    }
    return entry.name.endsWith('.ts') ? [path] : [];
  });
}

function topLayer(file: string): 'kernel' | 'host' | 'main' | 'plugin' {
  const rel = relative(ROOT, file).split(sep);
  if (rel[0] === 'plugins') {
    return 'plugin';
  }
  if (rel[1] === 'kernel') {
    return 'kernel';
  }
  if (rel[1] === 'host') {
    return 'host';
  }
  return 'main';
}

function pluginPackageOf(file: string): string {
  return relative(PLUGINS, file).split(sep)[0];
}

function kernelSubmodule(file: string): string {
  return relative(join(SRC, 'kernel'), file).split(sep)[0];
}

const allFiles = [...tsFiles(SRC), ...tsFiles(PLUGINS)];

describe('Phase 2 architecture rules', () => {
  it('discovers kernel, host, and plugin TypeScript sources', () => {
    assert.ok(allFiles.length >= 40, `expected >= 40 files, found ${allFiles.length}`);
  });

  it('enforces strict layer dependency direction (kernel ↛ host/plugins; plugins ↛ host/other-plugins)', () => {
    const violations: string[] = [];
    for (const file of allFiles) {
      const fromLayer = topLayer(file);
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/from '(\.[^']+)'/g)) {
        const targetAbs = resolve(dirname(file), match[1]);
        const targetRel = relative(ROOT, targetAbs).split(sep);
        const toLayer =
          targetRel[0] === 'plugins'
            ? 'plugin'
            : targetRel[1] === 'kernel'
              ? 'kernel'
              : targetRel[1] === 'host'
                ? 'host'
                : 'main';

        if (fromLayer === 'kernel') {
          if (toLayer !== 'kernel') {
            violations.push(`kernel file ${relative(ROOT, file)} imports ${match[1]} (${toLayer})`);
          } else {
            const fromSub = kernelSubmodule(file);
            const toSub = targetRel[2];
            if (toSub !== fromSub && !KERNEL_ALLOWED[fromSub]?.includes(toSub)) {
              violations.push(`kernel/${fromSub} file ${relative(ROOT, file)} imports kernel/${toSub}`);
            }
          }
        } else if (fromLayer === 'plugin') {
          if (toLayer === 'host' || toLayer === 'main') {
            violations.push(`plugin file ${relative(ROOT, file)} imports ${match[1]} (${toLayer})`);
          } else if (toLayer === 'plugin' && targetRel[1] !== pluginPackageOf(file)) {
            violations.push(`plugin ${pluginPackageOf(file)} imports sibling plugin ${targetRel[1]}`);
          }
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it('PluginLoader has zero hardcoded concrete plugin imports or switch statements', () => {
    const loaderSrc = readFileSync(join(SRC, 'host', 'PluginLoader.ts'), 'utf8');
    assert.doesNotMatch(loaderSrc, /plugins\//);
    assert.doesNotMatch(loaderSrc, /\bswitch\s*\(/);
  });

  it('CLI runtime code imports only Node built-ins (zero third-party runtime dependencies)', () => {
    const external = allFiles.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/from '([^.][^']*)'/g)]
        .map((m) => m[1])
        .filter((name) => !name.startsWith('node:')),
    );
    assert.deepEqual(external, []);
  });

  it('one exported top-level class or interface per file (excluding main.ts and index.ts)', () => {
    const problems: string[] = [];
    for (const file of allFiles) {
      const name = basename(file, '.ts');
      if (name === 'main' || name === 'index') {
        continue;
      }
      const declared = [
        ...readFileSync(file, 'utf8').matchAll(/^export (?:abstract )?(?:class|interface) (\w+)/gm),
      ].map((m) => m[1]);
      if (declared.length !== 1 || declared[0] !== name) {
        problems.push(`${relative(ROOT, file)}: ${declared.join(', ') || 'nothing'}`);
      }
    }
    assert.deepEqual(problems, []);
  });

  it('no switch statements (type dispatch is polymorphic / registry-based)', () => {
    const offenders = allFiles.filter((file) => /\bswitch\s*\(/.test(readFileSync(file, 'utf8')));
    assert.deepEqual(offenders.map((f) => relative(ROOT, f)), []);
  });
});
