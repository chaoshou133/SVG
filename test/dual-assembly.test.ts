import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';

const ROOT = resolve(__dirname, '..', '..');
const CLI_ENTRY = join(ROOT, 'dist', 'src', 'main.js');
const CONFIG_FILE = join(ROOT, 'plugins.config.json');
const TRANSCRIPTS = join(ROOT, 'doc', 'transcript');
const OTHER_SVG = join(ROOT, 'test', 'fixtures', 'other.svg');

function runCli(args: readonly string[], input: string, cwd: string): string {
  return execFileSync(process.execPath, [CLI_ENTRY, ...args], {
    input,
    cwd,
    encoding: 'utf8',
  });
}

describe('Dual-assembly byte-for-byte consistency (Mode A vs Mode B)', () => {
  for (const file of ['cli-1.txt', 'box-session.txt', 'commands-session.txt']) {
    it(`produces byte-for-byte identical output for ${file}`, () => {
      const input = readFileSync(join(TRANSCRIPTS, file), 'utf8');
      const dirA = mkdtempSync(join(tmpdir(), 'svg-mode-a-'));
      const dirB = mkdtempSync(join(tmpdir(), 'svg-mode-b-'));
      try {
        for (const d of [dirA, dirB]) {
          mkdirSync(join(d, 'docs'));
          mkdirSync(join(d, 'plugins'));
          writeFileSync(join(d, '.env'), 'MODE=test\n', 'utf8');
          copyFileSync(OTHER_SVG, join(d, 'other.svg'));
        }
        const outA = runCli([], input, dirA);
        const outB = runCli(['--config', CONFIG_FILE], input, dirB);
        assert.equal(outA, outB);
      } finally {
        rmSync(dirA, { recursive: true, force: true });
        rmSync(dirB, { recursive: true, force: true });
      }
    });
  }

  it('keeps Phase 1 baseline output intact when optional plugins are disabled (--no-plugins)', () => {
    const input = readFileSync(join(TRANSCRIPTS, 'cli-1.txt'), 'utf8');
    const dir = mkdtempSync(join(tmpdir(), 'svg-baseline-'));
    try {
      copyFileSync(OTHER_SVG, join(dir, 'other.svg'));
      const out = runCli(['--no-plugins'], input, dir);
      assert.match(out, /svg-editor 0\.1 — type 'help' for commands/);
      assert.match(out, /svg \(800x600\)\r?\n├── rect#bg/);
      assert.doesNotMatch(out, / \*$/m); // no modified-star labels when plugins disabled
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
