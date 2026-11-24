import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import shapeBox from '../plugins/plugin-shape-box';
import treeStar, { ModifiedStarDecorator } from '../plugins/plugin-tree-star';
import { BuiltinAssembly } from '../src/host/BuiltinAssembly';
import { NullDirectoryAdapter } from '../src/host/NullDirectoryAdapter';
import { BufferOutput } from '../src/kernel/cli/BufferOutput';
import { Editor } from '../src/kernel/cli/Editor';
import { EditorSession } from '../src/kernel/cli/EditorSession';
import { MemoryFileSystem } from './support/MemoryFileSystem';

describe('modified-star tree decorator plugin', () => {
  it('follows full state machine: init -> edit -> save -> edit -> undo back to save -> redo', () => {
    const fs = new MemoryFileSystem();
    const out = new BufferOutput();
    const session = new EditorSession(fs, out, new NullDirectoryAdapter());
    new BuiltinAssembly().install(session);
    session.plugins.loadPlugin(treeStar);
    const editor = new Editor(session);

    const run = (cmd: string): string[] => {
      editor.execute(cmd);
      return out.take();
    };

    // Fresh init: clean (no *)
    run('init 800 600');
    assert.deepEqual(run('tree'), ['svg (800x600)']);

    // New shape created: both root and new shape carry *
    run('create rect r1 10 20 100 50 #eee');
    assert.deepEqual(run('tree'), [
      'svg (800x600) *',
      '└── rect#r1    x=10 y=20 w=100 h=50 fill=#eee *',
    ]);

    // Save: all * disappear
    run('save a.svg');
    assert.deepEqual(run('tree'), [
      'svg (800x600)',
      '└── rect#r1    x=10 y=20 w=100 h=50 fill=#eee',
    ]);

    // Edit after save: * reappears on root and modified node
    run('set r1 fill red');
    assert.deepEqual(run('tree'), [
      'svg (800x600) *',
      '└── rect#r1    x=10 y=20 w=100 h=50 fill=red *',
    ]);

    // Undo back to save point: * disappears again
    run('undo');
    assert.deepEqual(run('tree'), [
      'svg (800x600)',
      '└── rect#r1    x=10 y=20 w=100 h=50 fill=#eee',
    ]);

    // Redo: * returns
    run('redo');
    assert.deepEqual(run('tree'), [
      'svg (800x600) *',
      '└── rect#r1    x=10 y=20 w=100 h=50 fill=red *',
    ]);
  });

  it('coexists cleanly with (box) without cross-plugin coupling and isolates per-instance state', () => {
    const fs = new MemoryFileSystem();
    const out = new BufferOutput();
    const session = new EditorSession(fs, out, new NullDirectoryAdapter());
    new BuiltinAssembly().install(session);
    session.plugins.loadPlugin(shapeBox);
    session.plugins.loadPlugin(treeStar);
    const editor = new Editor(session);

    editor.execute('init 800 600');
    editor.execute('create box n1 120 100 160 60 "处理数据"');
    editor.execute('create line arrow1 280 130 520 130 black');
    editor.execute('group flowchart n1 arrow1');
    editor.execute('save f.svg');
    editor.execute('set n1 fill #f5a623');
    out.take();

    editor.execute('tree');
    const lines = out.take().map((l) => l.replace(/\s+/g, ' '));
    assert.deepEqual(lines, [
      'svg (800x600) *',
      '└── g#flowchart',
      ' ├── g#n1 (box)',
      ' │ ├── rect#n1-rect x=120 y=100 w=160 h=60 fill=#f5a623 *',
      ' │ └── text#n1-label (140,135) "处理数据"',
      ' └── line#arrow1 (280,130) -> (520,130)',
    ]);

    // Editing n1 container's own stroke puts BOTH (box) and * on g#n1 in deterministic order
    editor.execute('set n1 stroke black');
    out.take();
    editor.execute('tree n1');
    assert.equal(out.take()[0], 'g#n1 (box) *');

    // Instance isolation: two ModifiedStarDecorator instances hold completely separate state
    const d1 = new ModifiedStarDecorator();
    const d2 = new ModifiedStarDecorator();
    const s2 = new EditorSession(new MemoryFileSystem(), new BufferOutput(), new NullDirectoryAdapter());
    new BuiltinAssembly().install(s2);
    s2.decorators.register(d2);
    s2.events.subscribe(d2);
    const ed2 = new Editor(s2);
    ed2.execute('init 100 100');
    assert.equal(d2.decorate(null, s2.requireDocument()), null);
    // d1 was never notified of s2's doc; modifying s2 does not leak into d1
    ed2.execute('create rect x 0 0 1 1');
    assert.equal(d2.decorate(null, s2.requireDocument()), '*');
    assert.equal(d1.decorate(null, s2.requireDocument()), null);
  });
});
