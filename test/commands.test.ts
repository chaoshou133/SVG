import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AddToCommand } from '../src/commands/AddToCommand';
import { CommandHistory } from '../src/commands/CommandHistory';
import { CreateShapeCommand } from '../src/commands/CreateShapeCommand';
import { DeleteCommand } from '../src/commands/DeleteCommand';
import { GroupCommand } from '../src/commands/GroupCommand';
import { MoveCommand } from '../src/commands/MoveCommand';
import { ScaleCommand } from '../src/commands/ScaleCommand';
import { SetAttributeCommand } from '../src/commands/SetAttributeCommand';
import { UngroupCommand } from '../src/commands/UngroupCommand';
import { ZOrderCommand } from '../src/commands/ZOrderCommand';
import { ShapeFactory } from '../src/factory/ShapeFactory';
import type { Container } from '../src/model/Container';
import { SvgDocument } from '../src/model/SvgDocument';

const factory = new ShapeFactory();

/** Compact structural fingerprint: ids with nesting and geometry. */
function snapshot(container: Container): string {
  return container
    .children()
    .map((shape) => {
      const inner = shape.asContainer();
      const attrs = shape.svgAttributes().map(([k, v]) => `${k}=${v}`).join(',') + (shape.textContent() ?? '');
      return inner === null ? `${attrs}` : `${attrs}[${snapshot(inner)}]`;
    })
    .join(' ');
}

function setup(): { doc: SvgDocument; history: CommandHistory; run: (cmd: Parameters<CommandHistory['execute']>[0]) => string } {
  const doc = new SvgDocument();
  const history = new CommandHistory();
  const create = (type: string, id: string, args: string[], into: string | null = null): string =>
    history.execute(new CreateShapeCommand(doc, factory.createFromArgs(type, id, args), into));
  create('rect', 'bg', ['0', '0', '800', '600', '#ffffff']);
  create('text', 'title', ['20', '40', 'My Diagram']);
  create('circle', 'c1', ['100', '100', '20', 'red']);
  create('rect', 'box', ['200', '80', '60', '60', '#3366ff']);
  create('g', 'scene', []);
  create('g', 'inner', [], 'scene');
  create('line', 'l1', ['0', '0', '10', '10'], 'inner');
  return { doc, history, run: (cmd) => history.execute(cmd) };
}

/** Executes, undoes and redoes a command, asserting the round trip is exact. */
function roundTrip(doc: SvgDocument, history: CommandHistory, command: Parameters<CommandHistory['execute']>[0]): string {
  const before = snapshot(doc);
  const message = history.execute(command);
  const after = snapshot(doc);
  assert.notEqual(after, before, 'command should change the document');
  history.undo();
  assert.equal(snapshot(doc), before, 'undo restores the previous state');
  assert.equal(history.redo(), message, 'redo repeats the feedback');
  assert.equal(snapshot(doc), after, 'redo reapplies the change');
  return message;
}

describe('editing commands round-trip through undo/redo', () => {
  it('create in container', () => {
    const { doc, history } = setup();
    const msg = roundTrip(doc, history, new CreateShapeCommand(doc, factory.createFromArgs('ellipse', 'e', ['1', '2', '3', '4']), 'inner'));
    assert.equal(msg, 'ellipse#e created in g#inner');
  });

  it('delete a container with descendants', () => {
    const { doc, history } = setup();
    assert.equal(roundTrip(doc, history, new DeleteCommand(doc, 'scene')), 'g#scene deleted');
    assert.equal(doc.find('l1'), undefined);
  });

  it('move leaf and container', () => {
    const { doc, history } = setup();
    assert.equal(roundTrip(doc, history, new MoveCommand(doc, 'c1', 30, 0)), 'circle#c1 moved to (130,100)');
    assert.equal(history.undo(), 'circle#c1 moved back to (100,100)');
    assert.equal(roundTrip(doc, history, new MoveCommand(doc, 'scene', 0, 100)), 'g#scene moved by (0,100)');
    assert.equal(history.undo(), 'g#scene moved back by (0,-100)');
  });

  it('scale undo is exact', () => {
    const { doc, history } = setup();
    roundTrip(doc, history, new ScaleCommand(doc, 'box', 3));
  });

  it('set and unset attributes', () => {
    const { doc, history } = setup();
    assert.equal(roundTrip(doc, history, new SetAttributeCommand(doc, 'title', 'text', 'v2')), 'text#title updated: text="v2"');
    roundTrip(doc, history, new SetAttributeCommand(doc, 'title', 'fill', 'blue'));
    assert.equal(history.undo(), 'text#title updated: fill unset');
  });

  it('group takes the place of the first member and keeps document order', () => {
    const { doc, history } = setup();
    const msg = roundTrip(doc, history, new GroupCommand(doc, 'markers', ['box', 'c1']));
    assert.equal(msg, 'g#markers created with 2 children');
    assert.deepEqual(doc.children().map((s) => s.id), ['bg', 'title', 'markers', 'scene']);
    const markers = doc.require('markers').asContainer() as Container;
    assert.deepEqual(markers.children().map((s) => s.id), ['c1', 'box']);
  });

  it('group across different parents round-trips', () => {
    const { doc, history } = setup();
    roundTrip(doc, history, new GroupCommand(doc, 'mix', ['l1', 'bg']));
  });

  it('ungroup puts children in the group position', () => {
    const { doc, history } = setup();
    const msg = roundTrip(doc, history, new UngroupCommand(doc, 'inner'));
    assert.equal(msg, 'g#inner ungrouped (1 children moved to g#scene)');
  });

  it('addto and z-order', () => {
    const { doc, history } = setup();
    assert.equal(roundTrip(doc, history, new AddToCommand(doc, 'scene', 'bg')), 'rect#bg added to g#scene');
    assert.equal(roundTrip(doc, history, new ZOrderCommand(doc, 'title', true)), 'text#title brought to front');
    assert.equal(roundTrip(doc, history, new ZOrderCommand(doc, 'bg', false)), 'rect#bg sent to back');
  });
});

describe('failed commands leave no trace', () => {
  const cases: [string, (doc: SvgDocument) => Parameters<CommandHistory['execute']>[0], RegExp][] = [
    ['duplicate id', (doc) => new CreateShapeCommand(doc, factory.createFromArgs('rect', 'bg', ['0', '0', '1', '1']), null), /id already exists: bg/],
    ['missing container', (doc) => new CreateShapeCommand(doc, factory.createFromArgs('g', 'n', []), 'node9'), /no such container: node9/],
    ['not a container', (doc) => new CreateShapeCommand(doc, factory.createFromArgs('g', 'n', []), 'bg'), /not a container: bg/],
    ['missing shape', (doc) => new DeleteCommand(doc, 'r9'), /no such shape: r9/],
    ['non-positive scale', (doc) => new ScaleCommand(doc, 'bg', 0), /scale factor must be positive/],
    ['unknown attribute', (doc) => new SetAttributeCommand(doc, 'bg', 'cx', '1'), /unknown attribute: cx/],
    ['group container with its descendant', (doc) => new GroupCommand(doc, 'bad', ['l1', 'scene']), /cannot group a container into its own descendant: scene/],
    ['group with missing member', (doc) => new GroupCommand(doc, 'bad', ['bg', 'zz']), /no such shape: zz/],
    ['ungroup top-level', (doc) => new UngroupCommand(doc, 'scene'), /cannot ungroup top-level container: scene/],
    ['ungroup leaf', (doc) => new UngroupCommand(doc, 'bg'), /not a container: bg/],
    ['addto into own descendant', (doc) => new AddToCommand(doc, 'inner', 'scene'), /cannot group a container into its own descendant: scene/],
    ['addto into itself', (doc) => new AddToCommand(doc, 'scene', 'scene'), /cannot group a container into its own descendant: scene/],
  ];
  for (const [name, make, expected] of cases) {
    it(name, () => {
      const { doc, history } = setup();
      const before = snapshot(doc);
      assert.throws(() => history.execute(make(doc)), expected);
      assert.equal(snapshot(doc), before);
      assert.ok(history.canUndo());
    });
  }
});

describe('CommandHistory', () => {
  it('a new edit clears the redo stack', () => {
    const { doc, history } = setup();
    history.execute(new MoveCommand(doc, 'c1', 1, 1));
    history.undo();
    history.execute(new MoveCommand(doc, 'c1', 2, 2));
    assert.throws(() => history.redo(), /nothing to redo/);
  });

  it('io lock blocks undo until the next edit', () => {
    const { doc, history } = setup();
    history.lockAfterIo();
    assert.throws(() => history.undo(), /undo not allowed after io command/);
    assert.throws(() => history.redo(), /redo not allowed after io command/);
    history.execute(new MoveCommand(doc, 'c1', 1, 1));
    assert.equal(history.undo(), 'circle#c1 moved back to (100,100)');
    assert.throws(() => history.undo(), /nothing to undo/);
  });
});
