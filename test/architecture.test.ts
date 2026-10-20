import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { basename, dirname, join, relative, resolve, sep } from 'node:path';
import { describe, it } from 'node:test';

/**
 * Executable version of the architecture rules in doc/README.md §1.3:
 * dependency direction between modules, one class per file, and no
 * switch-based type dispatch.
 */
const SRC = resolve(__dirname, '..', '..', 'src');

/** Module → modules it may import from (besides itself). */
const ALLOWED: Readonly<Record<string, readonly string[]>> = {
  model: [],
  factory: ['model'],
  commands: ['model'],
  io: ['model', 'factory'],
  view: ['model'],
  cli: ['model', 'factory', 'commands', 'io', 'view'],
  main: ['cli', 'io'],
};

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : entry.name.endsWith('.ts') ? [path] : [];
  });
}

function moduleOf(file: string): string {
  const first = relative(SRC, file).split(sep)[0];
  return first.endsWith('.ts') ? basename(first, '.ts') : first;
}

const files = sourceFiles(SRC);

describe('architecture rules', () => {
  it('finds the sources', () => {
    assert.ok(files.length > 40, `found ${files.length} files`);
  });

  it('every import follows the dependency direction', () => {
    const violations: string[] = [];
    for (const file of files) {
      const from = moduleOf(file);
      const source = readFileSync(file, 'utf8');
      for (const match of source.matchAll(/from '(\.[^']+)'/g)) {
        const to = moduleOf(resolve(dirname(file), match[1]));
        if (to !== from && !ALLOWED[from].includes(to)) {
          violations.push(`${relative(SRC, file)} (${from}) imports ${match[1]} (${to})`);
        }
      }
    }
    assert.deepEqual(violations, []);
  });

  it('runtime code imports only Node built-ins (zero dependencies)', () => {
    const external = files.flatMap((file) =>
      [...readFileSync(file, 'utf8').matchAll(/from '([^.][^']*)'/g)].map((m) => m[1]).filter((name) => !name.startsWith('node:')),
    );
    assert.deepEqual(external, []);
  });

  it('one top-level class or interface per file, named like the file', () => {
    const problems: string[] = [];
    for (const file of files.filter((f) => moduleOf(f) !== 'main')) {
      const declared = [...readFileSync(file, 'utf8').matchAll(/^export (?:abstract )?(?:class|interface) (\w+)/gm)].map((m) => m[1]);
      if (declared.length !== 1 || declared[0] !== basename(file, '.ts')) {
        problems.push(`${relative(SRC, file)}: ${declared.join(', ') || 'nothing'}`);
      }
    }
    assert.deepEqual(problems, []);
  });

  it('no switch statements (type dispatch is polymorphic)', () => {
    const offenders = files.filter((file) => /\bswitch\s*\(/.test(readFileSync(file, 'utf8')));
    assert.deepEqual(offenders.map((f) => relative(SRC, f)), []);
  });

  it('by-name dispatch exists only in the two sanctioned places, both marked for refactoring', () => {
    for (const name of ['factory/ShapeFactory.ts', 'cli/CommandRegistry.ts']) {
      assert.match(readFileSync(join(SRC, name), 'utf8'), /TODO\(refactor/, name);
    }
  });
});
