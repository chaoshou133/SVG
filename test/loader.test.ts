import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { AppBootstrap } from '../src/host/AppBootstrap';
import { NullDirectoryAdapter } from '../src/host/NullDirectoryAdapter';
import { PluginLoader } from '../src/host/PluginLoader';
import { BufferOutput } from '../src/kernel/cli/BufferOutput';
import { EditorSession } from '../src/kernel/cli/EditorSession';
import { SetAttributeCommand } from '../src/kernel/commands/SetAttributeCommand';
import type { AttributeHandler } from '../src/kernel/ext/AttributeHandler';
import { Command } from '../src/kernel/ext/Command';
import type { Plugin } from '../src/kernel/ext/Plugin';
import { EditorError } from '../src/kernel/model/EditorError';
import { SvgDocument } from '../src/kernel/model/SvgDocument';
import builtinShapes from '../plugins/builtin-shapes';
import { MemoryFileSystem } from './support/MemoryFileSystem';

function makeTempDir(): string {
  return mkdtempSync(join(tmpdir(), 'svg-editor-loader-'));
}

describe('PluginLoader failure handling, manifest validation, and rollback', () => {
  it('handles invalid JSON / schema in plugins.config.json and falls back to built-ins', () => {
    const dir = makeTempDir();
    try {
      const badJson = join(dir, 'bad.json');
      writeFileSync(badJson, '{ broken json', 'utf8');
      const out = new BufferOutput();
      const editor = new AppBootstrap().createEditor(['--config', badJson], new MemoryFileSystem(), out, new NullDirectoryAdapter());
      assert.deepEqual(out.take(), ['error: invalid plugin config']);
      // Built-in capabilities still work
      editor.execute('init 100 100');
      assert.deepEqual(out.take(), ['canvas 100x100 created']);

      const badSchema = join(dir, 'bad-schema.json');
      writeFileSync(badSchema, JSON.stringify({ plugins: [{ module: '' }] }), 'utf8');
      const out2 = new BufferOutput();
      new AppBootstrap().createEditor(['--config', badSchema], new MemoryFileSystem(), out2, new NullDirectoryAdapter());
      assert.deepEqual(out2.take(), ['error: invalid plugin config']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('reports all 4 loader failures cleanly without exiting and keeps valid plugins', () => {
    const dir = makeTempDir();
    try {
      // 1) No default export
      const noDefDir = join(dir, 'p-nodef');
      mkdirSync(noDefDir);
      writeFileSync(join(noDefDir, 'package.json'), JSON.stringify({ name: 'p-nodef', main: 'index.js' }));
      writeFileSync(join(noDefDir, 'index.js'), 'exports.foo = 123;\n');

      // 2) Manifest mismatch (declares commands/ghost, registers commands/actual)
      const misDir = join(dir, 'p-mismatch');
      mkdirSync(misDir);
      writeFileSync(
        join(misDir, 'package.json'),
        JSON.stringify({ name: 'p-mismatch', main: 'index.js', contributes: { commands: ['ghost'] } }),
      );
      writeFileSync(
        join(misDir, 'index.js'),
        `exports.default = {
          name: 'p-mismatch',
          activate(ctx) {
            ctx.registerCommand({ name: 'actual', usage: 'actual', summary: 'x', run() {} });
          }
        };\n`,
      );

      // 3) Activate throws AFTER registering a partial command (must roll back!)
      const throwDir = join(dir, 'p-throws');
      mkdirSync(throwDir);
      writeFileSync(
        join(throwDir, 'package.json'),
        JSON.stringify({ name: 'p-throws', main: 'index.js', contributes: { commands: ['partial'] } }),
      );
      writeFileSync(
        join(throwDir, 'index.js'),
        `exports.default = {
          name: 'p-throws',
          activate(ctx) {
            ctx.registerCommand({ name: 'partial', usage: 'partial', summary: 'x', run() {} });
            throw new Error('boom during init');
          }
        };\n`,
      );

      // 4) Module exists but nested require fails (must NOT misreport as plugin not found)
      const nestedDir = join(dir, 'p-nested-err');
      mkdirSync(nestedDir);
      writeFileSync(join(nestedDir, 'package.json'), JSON.stringify({ name: 'p-nested-err', main: 'index.js' }));
      writeFileSync(join(nestedDir, 'index.js'), `require('./definitely-missing-dep-xyz');\n`);

      // 5) Disabled plugin (skipped)
      const disDir = join(dir, 'p-disabled');
      mkdirSync(disDir);
      writeFileSync(join(disDir, 'package.json'), JSON.stringify({ name: 'p-disabled', main: 'index.js' }));
      writeFileSync(join(disDir, 'index.js'), `throw new Error('should not load');\n`);

      // 6) Valid plugin receiving options
      const okDir = join(dir, 'p-ok');
      mkdirSync(okDir);
      writeFileSync(
        join(okDir, 'package.json'),
        JSON.stringify({ name: 'p-ok', main: 'index.js', contributes: { commands: ['ping'] } }),
      );
      writeFileSync(
        join(okDir, 'index.js'),
        `exports.default = {
          name: 'p-ok',
          activate(ctx) {
            const tag = String(ctx.options.tag ?? 'default');
            ctx.registerCommand({
              name: 'ping',
              usage: 'ping',
              summary: 'ping test',
              run(_args, session) { session.out.info('pong:' + tag); }
            });
          }
        };\n`,
      );

      const cfgPath = join(dir, 'plugins.config.json');
      writeFileSync(
        cfgPath,
        JSON.stringify({
          plugins: [
            { module: './non-existent-plugin' },
            { module: './p-nodef' },
            { module: './p-mismatch' },
            { module: './p-throws' },
            { module: './p-nested-err' },
            { module: './p-disabled', enabled: false },
            { module: './p-ok', options: { tag: 'v2' } },
          ],
        }),
      );

      const out = new BufferOutput();
      const editor = new AppBootstrap().createEditor(['--config', cfgPath], new MemoryFileSystem(), out, new NullDirectoryAdapter());
      const errors = out.take();

      assert.equal(errors[0], 'error: plugin not found: ./non-existent-plugin');
      assert.equal(errors[1], 'error: plugin has no default export: ./p-nodef');
      assert.match(errors[2], /^error: plugin manifest mismatch: p-mismatch \(declared: commands\/ghost, registered: commands\/actual\)$/);
      assert.equal(errors[3], 'error: plugin failed to activate: p-throws (boom during init)');
      assert.match(errors[4], /^error: plugin failed to activate: p-nested-err \(/);
      assert.equal(errors.length, 5);

      // Rolled-back commands must NOT be registered
      assert.equal(editor.session.commands.has('actual'), false);
      assert.equal(editor.session.commands.has('partial'), false);
      // Valid plugin loaded with options
      editor.execute('ping');
      assert.deepEqual(out.take(), ['pong:v2']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('rejects duplicate registration and rolls back all staged items of the offending plugin', () => {
    const out = new BufferOutput();
    const session = new EditorSession(new MemoryFileSystem(), out, new NullDirectoryAdapter());
    class DummyCmd extends Command {
      readonly usage: string;
      readonly summary = 'dummy';
      constructor(readonly name: string) {
        super();
        this.usage = name;
      }
      run(): void {}
    }
    const p1: Plugin = {
      name: 'p1',
      activate(ctx) {
        ctx.registerCommand(new DummyCmd('alpha'));
      },
    };
    const p2: Plugin = {
      name: 'p2',
      activate(ctx) {
        ctx.registerCommand(new DummyCmd('beta'));
        ctx.registerCommand(new DummyCmd('alpha')); // duplicate!
      },
    };
    assert.equal(session.plugins.loadPlugin(p1), true);
    assert.equal(session.plugins.loadPlugin(p2), false);
    assert.deepEqual(out.take(), ['error: duplicate registration: commands/alpha']);
    assert.equal(session.commands.has('alpha'), true);
    assert.equal(session.commands.has('beta'), false); // rolled back!
  });

  it('PluginLoader works directly on a fresh EditorSession', () => {
    const dir = makeTempDir();
    try {
      const cfg = join(dir, 'plugins.config.json');
      writeFileSync(cfg, JSON.stringify({ plugins: [] }));
      const out = new BufferOutput();
      const session = new EditorSession(new MemoryFileSystem(), out, new NullDirectoryAdapter());
      new PluginLoader().loadFromConfigFile(cfg, session);
      assert.deepEqual(out.take(), []);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('AttributeHandler conflict resolution and transactional rollback', () => {
  it('resolves priority conflicts, rejects equal-priority ties, and rolls back partial mutations on error', () => {
    const out = new BufferOutput();
    const session = new EditorSession(new MemoryFileSystem(), out, new NullDirectoryAdapter());
    session.plugins.loadPlugin(builtinShapes);
    const doc = new SvgDocument(200, 200);
    doc.insert(session.shapes.createFromArgs('rect', 'r1', ['10', '20', '30', '40', 'blue']));
    session.replaceDocument(doc, null);

    // Register two competing handlers for fill: priority 10 beats priority 0
    const low: AttributeHandler = {
      name: 'low-fill',
      priority: 0,
      handles: (_id, attr) => attr === 'fill',
      apply: (id, _attr, val, ctx) => {
        ctx.getShape(id).setAttribute('fill', `low:${val}`);
        return { executeMessage: 'low', undoMessage: 'low-undo' };
      },
    };
    const high: AttributeHandler = {
      name: 'high-fill',
      priority: 10,
      handles: (_id, attr) => attr === 'fill',
      apply: (id, _attr, val, ctx) => {
        ctx.getShape(id).setAttribute('fill', `high:${val}`);
        return { executeMessage: 'high', undoMessage: 'high-undo' };
      },
    };
    session.attributes.register(low);
    session.attributes.register(high);

    session.edit(new SetAttributeCommand(doc, 'r1', 'fill', 'red', session.attributes));
    assert.equal(doc.require('r1').getAttribute('fill'), 'high:red');
    session.undo();
    assert.equal(doc.require('r1').getAttribute('fill'), 'blue');
    session.redo();
    assert.equal(doc.require('r1').getAttribute('fill'), 'high:red');

    // Equal priority tie must throw ambiguity error
    const tie: AttributeHandler = {
      name: 'tie-fill',
      priority: 10,
      handles: (_id, attr) => attr === 'fill',
      apply: () => ({ executeMessage: 'tie', undoMessage: 'tie-undo' }),
    };
    session.attributes.register(tie);
    assert.throws(
      () => session.edit(new SetAttributeCommand(doc, 'r1', 'fill', 'green', session.attributes)),
      /ambiguous attribute handlers for r1\.fill: high-fill, tie-fill/,
    );

    // Partial mutation + throw must fully roll back document AND leave undo/redo history intact
    const faulty: AttributeHandler = {
      name: 'faulty-stroke',
      priority: 5,
      handles: (_id, attr) => attr === 'stroke',
      apply: (id, _attr, val, ctx) => {
        const s = ctx.getShape(id);
        s.setAttribute('fill', 'corrupted');
        s.setAttribute('stroke', val);
        throw new EditorError('simulated mid-transaction failure');
      },
    };
    session.attributes.register(faulty);
    assert.throws(
      () => session.edit(new SetAttributeCommand(doc, 'r1', 'stroke', 'black', session.attributes)),
      /simulated mid-transaction failure/,
    );
    // Document rolled back completely (neither fill nor stroke corrupted)
    assert.equal(doc.require('r1').getAttribute('fill'), 'high:red');
    assert.equal(doc.require('r1').getAttribute('stroke'), undefined);
    // History untouched: undo still reverts the previous successful `high-fill` edit!
    session.undo();
    assert.equal(doc.require('r1').getAttribute('fill'), 'blue');
  });
});
