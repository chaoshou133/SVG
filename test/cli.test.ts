import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BufferOutput } from '../src/cli/BufferOutput';
import { Editor } from '../src/cli/Editor';
import { Tokenizer } from '../src/cli/Tokenizer';
import { MemoryFileSystem } from './support/MemoryFileSystem';
import { Transcript } from './support/Transcript';

function session(files: Record<string, string> = {}): { run: (...lines: string[]) => string[]; fs: MemoryFileSystem } {
  const fs = new MemoryFileSystem(files);
  const out = new BufferOutput();
  const editor = new Editor(fs, out);
  return {
    fs,
    run: (...lines) => {
      lines.forEach((line) => editor.execute(line));
      return out.take();
    },
  };
}

describe('Tokenizer', () => {
  const tokenizer = new Tokenizer();

  it('groups quoted words and keeps the quoted flag', () => {
    const tokens = tokenizer.tokenize('create text t 1 2 "in"  in  g');
    assert.deepEqual(tokens.map((t) => t.value), ['create', 'text', 't', '1', '2', 'in', 'in', 'g']);
    assert.deepEqual(tokens.map((t) => t.quoted), [false, false, false, false, false, true, false, false]);
  });

  it('supports escapes, empty strings and rejects unterminated quotes', () => {
    assert.deepEqual(tokenizer.tokenize('set t text "say \\"hi\\" \\\\ ok" ""').map((t) => t.value), ['set', 't', 'text', 'say "hi" \\ ok', '']);
    assert.throws(() => tokenizer.tokenize('set t text "oops'), /unterminated quote/);
  });
});

describe('Editor conventions', () => {
  it('requires a document for everything but init/read/help', () => {
    const { run } = session();
    for (const line of ['create rect r 0 0 1 1', 'tree', 'undo', 'save', 'canvas', 'show r']) {
      assert.deepEqual(run(line), ["error: no document. use 'init' or 'read' first"], line);
    }
    assert.ok(run('help').length > 10);
  });

  it('ignores blank and comment lines', () => {
    const { run } = session();
    assert.deepEqual(run('', '   ', '# init 1 1', '  # x'), []);
  });

  it('reports usage errors and invalid numbers without changing state', () => {
    const { run } = session();
    run('init');
    assert.deepEqual(run('move'), ['error: usage: move <id> <dx> <dy>']);
    assert.deepEqual(run('create rect r 1 2'), ['error: usage: create rect <id> <x> <y> <w> <h> [fill] [in <containerId>]']);
    assert.deepEqual(run('create rect r 1 2 3 x'), ['error: invalid number: x']);
    assert.deepEqual(run('create hexagon h 1 2'), ['error: unknown shape type: hexagon (is the plugin loaded?)']);
    assert.deepEqual(run('create box n1 0 0 10 10 "x"'), ['error: unknown shape type: box (is the plugin loaded?)']);
    assert.deepEqual(run('frobnicate'), ["error: unknown command: frobnicate. type 'help' for commands"]);
    assert.deepEqual(run('init 0 5'), ['error: canvas size must be positive']);
    assert.deepEqual(run('tree'), ['svg (800x600)']);
  });

  it('distinguishes the in keyword from quoted "in" text', () => {
    const { run } = session();
    run('init', 'create g box');
    assert.deepEqual(run('create text t1 0 0 "in" in box'), ['text#t1 created in g#box']);
    assert.deepEqual(run('create text t2 0 0 in'), ['text#t2 created']);
    assert.deepEqual(run('create rect r 0 0 1 1 in nowhere'), ['error: no such container: nowhere']);
    assert.deepEqual(run('create rect r 0 0 1 1 in t1'), ['error: not a container: t1']);
  });

  it('set on a container sets the inherited style on <g> (Composite)', () => {
    const { run, fs } = session();
    run('init 100 100', 'create g g1', 'create rect r 0 0 1 1 in g1');
    assert.deepEqual(run('set g1 fill red', 'set g1 x 5', 'set r stroke-width wide'), [
      'g#g1 updated: fill=red',
      'error: unknown attribute: x',
      'error: invalid number: wide',
    ]);
    run('save out.svg');
    assert.match(fs.files.get('out.svg') as string, /<g id="g1" fill="red">/);
  });

  it('scale recurses into containers and undo restores exactly', () => {
    const { run } = session();
    run('init', 'create g g', 'create rect r 10 10 3 3 in g', 'create circle c 1 1 1 in g');
    assert.deepEqual(run('scale g 0.1', 'tree g'), [
      'g#g scaled by 0.1',
      'g#g',
      '├── rect#r    x=1 y=1 w=0.3 h=0.3',
      '└── circle#c  cx=0.1 cy=0.1 r=0.1',
    ]);
    assert.deepEqual(run('undo', 'show r'), ['g#g scale by 0.1 undone', 'rect#r  parent=g#g', '  x=10 y=10 width=3 height=3']);
  });

  it('show lists text, children, style and preserved attributes', () => {
    const { run } = session({ 'a.svg': '<svg width="10" height="10"><g id="g" transform="scale(2)"><text id="t" x="1" y="2" fill="red">hi</text></g></svg>' });
    run('read a.svg');
    assert.deepEqual(run('show t'), ['text#t  parent=g#g', '  x=1 y=2', '  text="hi"', '  fill=red']);
    assert.deepEqual(run('show g'), ['g#g  parent=svg', '  children=1 (t)', '  transform=scale(2)']);
  });

  it('save without a path uses the read path; IO errors are reported', () => {
    const { run, fs } = session({ 'in.svg': Transcript.fixture('other.svg') });
    run('init');
    assert.deepEqual(run('save'), ["error: no file name. use 'save <file.svg>'"]);
    run('read in.svg', 'move c1 1 1');
    assert.deepEqual(run('save'), ['saved to in.svg (7 elements)']);
    assert.match(fs.files.get('in.svg') as string, /cx="51"/);
    fs.readOnly.add('locked.svg');
    assert.deepEqual(run('save locked.svg'), ['error: cannot write file: locked.svg']);
    assert.deepEqual(run('read missing.svg'), ['error: cannot read file: missing.svg']);
  });

  it('a failed read keeps the current document and prints no warnings', () => {
    const { run } = session({ 'bad.svg': '<svg><rect></svg>' });
    run('init 10 10', 'create rect keep 0 0 1 1');
    assert.deepEqual(run('read bad.svg'), ['error: invalid svg: expected </rect> but found </svg> (line 1)']);
    assert.deepEqual(run('tree'), ['svg (10x10)', '└── rect#keep  x=0 y=0 w=1 h=1']);
  });

  it('canvas shows and resizes; resizing is an io command', () => {
    const { run } = session();
    run('init', 'create rect r 0 0 1 1');
    assert.deepEqual(run('canvas', 'canvas 1024 768', 'undo', 'canvas 5'), [
      'canvas 800x600',
      'canvas resized to 1024x768',
      'error: undo not allowed after io command',
      'error: usage: canvas [w h]',
    ]);
  });

  it('undo after io is re-enabled by the next edit, and redo is cleared by new edits', () => {
    const { run } = session();
    run('init', 'create rect r 0 0 1 1', 'save x.svg');
    assert.deepEqual(run('undo', 'move r 1 0', 'undo', 'undo'), [
      'error: undo not allowed after io command',
      'rect#r moved to (1,0)',
      'rect#r moved back to (0,0)',
      'error: nothing to undo',
    ]);
    assert.deepEqual(run('move r 5 5', 'undo', 'move r 1 1', 'redo'), [
      'rect#r moved to (5,5)',
      'rect#r moved back to (0,0)',
      'rect#r moved to (1,1)',
      'error: nothing to redo',
    ]);
  });

  it('group / ungroup / addto / front / back via the CLI', () => {
    const { run } = session();
    run('init', 'create g scene', 'create rect a 0 0 1 1 in scene', 'create rect b 0 0 1 1 in scene', 'create circle c 0 0 1 in scene');
    assert.deepEqual(run('group pair a c', 'tree scene'), [
      'g#pair created with 2 children',
      'g#scene',
      '├── g#pair',
      '│   ├── rect#a    x=0 y=0 w=1 h=1',
      '│   └── circle#c  cx=0 cy=0 r=1',
      '└── rect#b        x=0 y=0 w=1 h=1',
    ]);
    assert.deepEqual(run('ungroup pair', 'ungroup scene', 'front a', 'back b', 'addto pair b'), [
      'g#pair ungrouped (2 children moved to g#scene)',
      'error: cannot ungroup top-level container: scene',
      'rect#a brought to front',
      'rect#b sent to back',
      'error: no such container: pair',
    ]);
    assert.deepEqual(run('tree'), ['svg (800x600)', '└── g#scene', '    ├── rect#b    x=0 y=0 w=1 h=1', '    ├── circle#c  cx=0 cy=0 r=1', '    └── rect#a    x=0 y=0 w=1 h=1']);
  });

  it('exit stops the loop', () => {
    const fs = new MemoryFileSystem();
    const editor = new Editor(fs, new BufferOutput());
    assert.equal(editor.execute('help'), true);
    assert.equal(editor.execute('exit'), false);
  });
});
