import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, it } from 'node:test';
import boxPlugin, { Box } from '../plugins/plugin-shape-box';
import { AppBootstrap } from '../src/host/AppBootstrap';
import { NullDirectoryAdapter } from '../src/host/NullDirectoryAdapter';
import { BufferOutput } from '../src/kernel/cli/BufferOutput';
import type { AttributeHandler } from '../src/kernel/ext/AttributeHandler';
import type { PluginContext } from '../src/kernel/ext/PluginContext';
import type { ShapeProvider } from '../src/kernel/ext/ShapeProvider';
import type { TreeDecorator } from '../src/kernel/ext/TreeDecorator';
import { MemoryFileSystem } from './support/MemoryFileSystem';

const REPO_ROOT = resolve(__dirname, '..', '..');

function withBoxConfig<T>(fn: (cfgPath: string) => T): T {
  const dir = mkdtempSync(join(REPO_ROOT, '.tmp-box-cfg-'));
  try {
    const cfgPath = join(dir, 'box-only.config.json');
    writeFileSync(
      cfgPath,
      JSON.stringify({
        plugins: [
          { module: '../plugins/plugin-cmd-stats' },
          { module: '../plugins/plugin-shape-box' },
        ],
      }),
      'utf8',
    );
    return fn(cfgPath);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe('box plugin — independent unit test via test-double PluginContext', () => {
  it('registers ShapeProvider, AttributeHandler, and TreeDecorator without host or sibling plugins', () => {
    const shapes: ShapeProvider[] = [];
    const attrs: AttributeHandler[] = [];
    const decs: TreeDecorator[] = [];
    const fakeCtx: PluginContext = {
      options: { fill: '#123456' },
      directoryAccess: new NullDirectoryAdapter(),
      registerShape: (p) => shapes.push(p),
      registerCommand: () => {},
      registerAttributeHandler: (h) => attrs.push(h),
      registerTreeDecorator: (d) => decs.push(d),
      onDocumentEvent: () => {},
    };

    boxPlugin.activate(fakeCtx);
    assert.deepEqual(shapes.map((s) => s.typeName), ['box']);
    assert.deepEqual(attrs.map((a) => a.name), ['box-attributes']);
    assert.deepEqual(decs.map((d) => d.name), ['box-type-label']);
  });
});

describe('box plugin — Phase 1 §6.1 Version B, boundaries, round-trip, and degradation', () => {
  it('reproduces Phase 1 §6.1 Version B box flowchart session via Mode B config', () => {
    withBoxConfig((cfgPath) => {
    const fs = new MemoryFileSystem();
    const out = new BufferOutput();
    const editor = new AppBootstrap().createEditor(['--config', cfgPath], fs, out, new NullDirectoryAdapter());

    const run = (cmd: string): string[] => {
      editor.execute(cmd);
      return out.take();
    };

    assert.deepEqual(run('init 800 600'), ['canvas 800x600 created']);
    assert.deepEqual(run('create box n1 120 100 160 60 "开始"'), [
      'box#n1 created (g#n1 + rect#n1-rect + text#n1-label)',
    ]);
    assert.deepEqual(run('create box n2 520 100 160 60 "处理数据"'), [
      'box#n2 created (g#n2 + rect#n2-rect + text#n2-label)',
    ]);
    assert.deepEqual(run('create line arrow1 280 130 520 130 black'), ['line#arrow1 created']);
    assert.deepEqual(run('group flowchart n1 n2 arrow1'), ['g#flowchart created with 3 children']);
    assert.deepEqual(run('move n2 0 100'), ['box#n2 moved by (0,100)']);
    assert.deepEqual(run('undo'), ['box#n2 moved back by (0,-100)']);
    assert.deepEqual(run('set n2 fill #f5a623'), ['box#n2 fill propagated to n2-rect']);
    assert.deepEqual(run('set n2 label "处理数据 v2"'), ['box#n2 label updated: "处理数据 v2"']);
    assert.deepEqual(run('undo'), ['box#n2 label restored: "处理数据"']);
    assert.deepEqual(run('redo'), ['box#n2 label updated: "处理数据 v2"']);
    assert.deepEqual(run('undo'), ['box#n2 label restored: "处理数据"']);

    const treeLines = run('tree');
    assert.deepEqual(
      treeLines.map((l) => l.replace(/\s+/g, ' ')),
      [
        'svg (800x600)',
        '└── g#flowchart',
        ' ├── g#n1 (box)',
        ' │ ├── rect#n1-rect x=120 y=100 w=160 h=60 fill=#4a90d9',
        ' │ └── text#n1-label (140,135) "开始"',
        ' ├── g#n2 (box)',
        ' │ ├── rect#n2-rect x=520 y=100 w=160 h=60 fill=#f5a623',
        ' │ └── text#n2-label (540,135) "处理数据"',
        ' └── line#arrow1 (280,130) -> (520,130)',
      ],
    );

    // stats counts flowchart + n1 + n2 as 3 containers, and 2 rects + 2 texts + 1 line = 5 leaves
    assert.deepEqual(run('stats'), ['rect: 2  text: 2  line: 1  (total 5, containers 3)']);

    assert.deepEqual(run('save flowchart-box.svg'), ['saved to flowchart-box.svg (8 elements)']);
    const saved = fs.files.get('flowchart-box.svg') as string;
    assert.match(saved, /<g id="n1" data-kind="box">/);
    assert.match(saved, /<g id="n2" data-kind="box">/);
    });
  });

  it('enforces id collision atomicity, nesting, ungroup rejection, and essential child protection', () => {
    withBoxConfig((cfgPath) => {
    const out = new BufferOutput();
    const editor = new AppBootstrap().createEditor(['--config', cfgPath], new MemoryFileSystem(), out, new NullDirectoryAdapter());
    const run = (cmd: string): string[] => {
      editor.execute(cmd);
      return out.take();
    };

    run('init');
    // Pre-create colliding child id `n1-rect`
    run('create rect n1-rect 0 0 10 10');
    assert.deepEqual(run('create box n1 10 10 100 50 "collide"'), ['error: id already exists: n1-rect']);
    // Must not leave partial `n1` or `n1-label`
    assert.equal(editor.session.requireDocument().has('n1'), false);
    assert.equal(editor.session.requireDocument().has('n1-label'), false);

    // Valid box + nested box
    run('create box n2 10 10 100 50 "outer"');
    assert.deepEqual(run('create box n3 20 20 50 30 "inner" in n2'), [
      'box#n3 created (g#n3 + rect#n3-rect + text#n3-label) in g#n2',
    ]);

    // ungroup rejected
    assert.deepEqual(run('ungroup n2'), ['error: cannot ungroup composite shape: n2']);
    assert.deepEqual(run('ungroup n3'), ['error: cannot ungroup composite shape: n3']);

    // Protecting essential sub-parts from delete / addto / group
    run('create g other');
    assert.match(run('delete n2-rect')[0], /^error: cannot detach essential child of composite shape: n2-rect/);
    assert.match(run('addto other n2-label')[0], /^error: cannot detach essential child of composite shape: n2-label/);
    assert.match(run('group g9 n2-rect other')[0], /^error: cannot detach essential child of composite shape: n2-rect/);

    // Non-essential nested child n3 CAN still be deleted normally
    assert.deepEqual(run('delete n3'), ['g#n3 deleted']);
    });
  });

  it('round-trips box when plugin is installed, degrades to g without plugin, and rejects duplicate ids', () => {
    withBoxConfig((cfgPath) => {
    const fs = new MemoryFileSystem();
    const out = new BufferOutput();
    const edWithBox = new AppBootstrap().createEditor(['--config', cfgPath], fs, out, new NullDirectoryAdapter());
    edWithBox.execute('init 400 200');
    edWithBox.execute('create box b1 10 20 100 50 "Hi"');
    edWithBox.execute('save b.svg');
    out.take();

    // 1) Read back WITH box plugin → restores Box
    edWithBox.execute('read b.svg');
    assert.deepEqual(out.take(), ['read b.svg (3 elements)']);
    assert.ok(edWithBox.session.requireDocument().require('b1') instanceof Box);
    edWithBox.execute('set b1 label "Restored"');
    assert.deepEqual(out.take(), ['box#b1 label updated: "Restored"']);

    // 2) Read back WITHOUT box plugin → degrades cleanly to plain g
    const outNoBox = new BufferOutput();
    const edNoBox = new AppBootstrap().createEditor(['--no-plugins'], fs, outNoBox, new NullDirectoryAdapter());
    edNoBox.execute('read b.svg');
    assert.deepEqual(outNoBox.take(), ['read b.svg (3 elements)']);
    assert.equal(edNoBox.session.requireDocument().require('b1').typeName, 'g');
    edNoBox.execute('set b1 label "x"');
    assert.deepEqual(outNoBox.take(), ['error: unknown attribute: label']);

    // 3) Malformed box (missing b2-label) with plugin installed → warns and degrades to plain g
    fs.files.set(
      'malformed.svg',
      '<svg width="100" height="100"><g id="b2" data-kind="box"><rect id="b2-rect" x="0" y="0" width="10" height="10"/></g></svg>',
    );
    edWithBox.execute('read malformed.svg');
    const malOut = out.take();
    assert.match(malOut[0], /^warning: invalid box structure on g#b2/);
    assert.equal(edWithBox.session.requireDocument().require('b2').typeName, 'g');

    // 4) Duplicate id inside box → rejects entire read and preserves previous document
    fs.files.set(
      'dup-box.svg',
      '<svg width="100" height="100"><g id="b3" data-kind="box"><rect id="b3-rect" x="0" y="0" width="10" height="10"/><text id="b3-rect" x="1" y="1">dup</text></g></svg>',
    );
    edWithBox.execute('read dup-box.svg');
    assert.deepEqual(out.take(), ['error: duplicate id in svg: b3-rect']);
    // Previous document (`malformed.svg` containing b2) is preserved untouched!
    assert.equal(edWithBox.session.requireDocument().has('b2'), true);
    assert.equal(edWithBox.session.requireDocument().has('b3'), false);
    });
  });
});
