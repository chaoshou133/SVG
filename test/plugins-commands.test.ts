import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import cmdDir from '../plugins/plugin-cmd-dir';
import cmdStats from '../plugins/plugin-cmd-stats';
import { AppBootstrap } from '../src/host/AppBootstrap';
import { BuiltinAssembly } from '../src/host/BuiltinAssembly';
import { NodeDirectoryAdapter } from '../src/host/NodeDirectoryAdapter';
import { NullDirectoryAdapter } from '../src/host/NullDirectoryAdapter';
import { BufferOutput } from '../src/kernel/cli/BufferOutput';
import { Editor } from '../src/kernel/cli/Editor';
import { EditorSession } from '../src/kernel/cli/EditorSession';
import type { DirectoryAccess } from '../src/kernel/io/DirectoryAccess';
import { DirectoryEntry } from '../src/kernel/io/DirectoryEntry';
import { EditorError } from '../src/kernel/model/EditorError';
import { MemoryFileSystem } from './support/MemoryFileSystem';

class FakeDirectoryAccess implements DirectoryAccess {
  constructor(
    private readonly cwd: string,
    private readonly entries: readonly DirectoryEntry[] | Error,
  ) {}

  currentDirectory(): string {
    return this.cwd;
  }

  listEntries(dirPath: string): readonly DirectoryEntry[] {
    if (this.entries instanceof Error) {
      throw new EditorError(`cannot read directory: ${dirPath}`);
    }
    return this.entries;
  }
}

describe('stats command plugin', () => {
  it('counts leaves in DFS first-appearance order, separates containers, and leaves undo stack untouched', () => {
    const out = new BufferOutput();
    const session = new EditorSession(new MemoryFileSystem(), out, new NullDirectoryAdapter());
    new BuiltinAssembly().install(session);
    session.plugins.loadPlugin(cmdStats);
    const editor = new Editor(session);

    editor.execute('init 800 600');
    out.take();
    editor.execute('stats');
    assert.deepEqual(out.take(), ['(total 0, containers 0)']);

    editor.execute('create rect r1 0 0 10 10');
    editor.execute('create g g1');
    editor.execute('create circle c1 5 5 2 in g1');
    editor.execute('create g g2 in g1');
    editor.execute('create text t1 1 2 "hi" in g2');
    editor.execute('create rect r2 0 0 5 5 in g2');
    editor.execute('create rect r3 1 1 2 2');
    editor.execute('create text t2 3 4 "ok"');
    out.take();

    editor.execute('stats');
    assert.deepEqual(out.take(), ['rect: 3  circle: 1  text: 2  (total 6, containers 2)']);

    // Appears in help
    editor.execute('help');
    assert.ok(out.take().some((line) => line.includes('stats')));

    // Did not enter undo stack: undo reverses create text t2
    editor.execute('undo');
    assert.deepEqual(out.take(), ['text#t2 creation undone']);
  });

  it('reports unknown command when stats plugin is not loaded', () => {
    const out = new BufferOutput();
    const editor = new AppBootstrap().createEditor(['--no-plugins'], new MemoryFileSystem(), out, new NullDirectoryAdapter());
    editor.execute('init');
    out.take();
    editor.execute('stats');
    assert.match(out.take()[0], /^error: unknown command: stats/);
  });
});

describe('dir command plugin (Adapter pattern)', () => {
  it('supports test-double DirectoryAccess: mixed entries, hidden files, empty dir, errors, stable sort', () => {
    const fakeEntries = [
      new DirectoryEntry('package.json', 'file'),
      new DirectoryEntry('plugins', 'dir'),
      new DirectoryEntry('.git', 'dir'),
      new DirectoryEntry('demo.svg', 'file'),
      new DirectoryEntry('.env', 'file'),
      new DirectoryEntry('docs', 'dir'),
      new DirectoryEntry('.', 'dir'),
      new DirectoryEntry('..', 'dir'),
    ];
    const out = new BufferOutput();
    const session = new EditorSession(new MemoryFileSystem(), out, new FakeDirectoryAccess('/mock/cwd', fakeEntries));
    new BuiltinAssembly().install(session);
    session.plugins.loadPlugin(cmdDir);
    const editor = new Editor(session);

    // Works WITHOUT init/read!
    editor.execute('dir');
    assert.deepEqual(out.take(), [
      '[DIR]  .git',
      '[DIR]  docs',
      '[DIR]  plugins',
      '[FILE]  .env',
      '[FILE]  demo.svg',
      '[FILE]  package.json',
    ]);

    // Rejects unexpected arguments
    editor.execute('dir extra');
    assert.deepEqual(out.take(), ['error: usage: dir']);

    // Empty directory
    const outEmpty = new BufferOutput();
    const sEmpty = new EditorSession(new MemoryFileSystem(), outEmpty, new FakeDirectoryAccess('/empty', []));
    sEmpty.plugins.loadPlugin(cmdDir);
    new Editor(sEmpty).execute('dir');
    assert.deepEqual(outEmpty.take(), ['(empty directory)']);

    // Read failure keeps session alive and does not affect undo/redo
    const outFail = new BufferOutput();
    const sFail = new EditorSession(new MemoryFileSystem(), outFail, new FakeDirectoryAccess('/denied', new Error('EACCES')));
    new BuiltinAssembly().install(sFail);
    sFail.plugins.loadPlugin(cmdDir);
    const edFail = new Editor(sFail);
    edFail.execute('init');
    edFail.execute('create rect r1 0 0 10 10');
    outFail.take();
    edFail.execute('dir');
    assert.deepEqual(outFail.take(), ['error: cannot read directory: /denied']);
    // Undo still works after failed dir!
    edFail.execute('undo');
    assert.deepEqual(outFail.take(), ['rect#r1 creation undone']);
  });

  it('works with real NodeDirectoryAdapter on a temporary directory and matches byte-for-byte in Mode A vs Mode B', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'svg-editor-dir-'));
    try {
      mkdirSync(join(tempDir, 'docs'));
      mkdirSync(join(tempDir, 'plugins'));
      mkdirSync(join(tempDir, '.hidden-dir'));
      writeFileSync(join(tempDir, 'demo.svg'), '<svg/>', 'utf8');
      writeFileSync(join(tempDir, 'package.json'), '{}', 'utf8');
      writeFileSync(join(tempDir, '.hidden-file'), 'x', 'utf8');

      const adapter = new NodeDirectoryAdapter(() => tempDir);
      const outA = new BufferOutput();
      const outB = new BufferOutput();
      const cfgPath = resolve(__dirname, '..', '..', 'plugins.config.json');

      const edA = new AppBootstrap().createEditor([], new MemoryFileSystem(), outA, adapter);
      const edB = new AppBootstrap().createEditor(['--config', cfgPath], new MemoryFileSystem(), outB, adapter);

      for (const line of ['dir', 'init 200 100', 'create rect r1 0 0 10 10', 'dir', 'stats', 'undo']) {
        edA.execute(line);
        edB.execute(line);
      }

      const linesA = outA.take();
      const linesB = outB.take();
      assert.deepEqual(linesA, linesB);
      assert.deepEqual(linesA.slice(0, 6), [
        '[DIR]  .hidden-dir',
        '[DIR]  docs',
        '[DIR]  plugins',
        '[FILE]  .hidden-file',
        '[FILE]  demo.svg',
        '[FILE]  package.json',
      ]);
      assert.equal(linesA[linesA.length - 1], 'rect#r1 creation undone');
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
