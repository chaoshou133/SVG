import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { Circle } from '../src/model/Circle';
import { EditorError } from '../src/model/EditorError';
import { Group } from '../src/model/Group';
import { Line } from '../src/model/Line';
import { Num } from '../src/model/Num';
import { Rect } from '../src/model/Rect';
import { SvgDocument } from '../src/model/SvgDocument';
import { Text } from '../src/model/Text';

describe('Num', () => {
  it('parses plain numbers strictly', () => {
    assert.equal(Num.parse('-1.5'), -1.5);
    assert.equal(Num.parse('.5'), 0.5);
    assert.throws(() => Num.parse('10px'), EditorError);
    assert.throws(() => Num.parse('abc'), /invalid number: abc/);
  });

  it('parses file values leniently', () => {
    assert.equal(Num.parseLenient('10px'), 10);
    assert.equal(Num.parseLenient(undefined), 0);
  });

  it('formats without floating point noise', () => {
    assert.equal(Num.format(0.1 + 0.2), '0.3');
    assert.equal(Num.format(-0), '0');
    assert.equal(Num.format(130), '130');
  });
});

describe('leaf shapes', () => {
  it('move shifts position attributes only', () => {
    const rect = new Rect('r', 10, 20, 100, 50);
    rect.move(5, -5);
    assert.deepEqual([rect.x, rect.y, rect.width, rect.height], [15, 15, 100, 50]);
    const line = new Line('l', 0, 0, 10, 10);
    line.move(1, 2);
    assert.deepEqual([line.x1, line.y1, line.x2, line.y2], [1, 2, 11, 12]);
  });

  it('scale multiplies every geometry attribute', () => {
    const circle = new Circle('c', 100, 50, 20);
    circle.scale(0.5);
    assert.deepEqual([circle.cx, circle.cy, circle.r], [50, 25, 10]);
  });

  it('memento restores geometry exactly', () => {
    const rect = new Rect('r', 1, 1, 1, 1);
    const memento = rect.createMemento();
    rect.scale(3);
    rect.scale(1 / 3);
    memento.restore();
    assert.deepEqual(rect.geometryEntries(), [['x', '1'], ['y', '1'], ['width', '1'], ['height', '1']]);
  });

  it('set enforces the whitelist and numeric geometry', () => {
    const rect = new Rect('r', 0, 0, 1, 1);
    rect.setAttribute('fill', 'red');
    rect.setAttribute('width', '42');
    assert.equal(rect.getAttribute('fill'), 'red');
    assert.equal(rect.width, 42);
    assert.throws(() => rect.setAttribute('cx', '1'), /unknown attribute: cx/);
    assert.throws(() => rect.setAttribute('width', 'wide'), /invalid number: wide/);
    assert.throws(() => rect.setAttribute('text', 'x'), /unknown attribute: text/);
  });

  it('text exposes its content as the text attribute', () => {
    const text = new Text('t', 20, 40, 'My Diagram');
    text.setAttribute('text', 'v2');
    assert.equal(text.textContent(), 'v2');
    assert.ok(text.settableAttributes().includes('text'));
  });

  it('fromArgs validates arity and optional style', () => {
    const rect = Rect.fromArgs('r1', ['10', '20', '100', '50', '#eee']);
    assert.deepEqual(rect.svgAttributes(), [
      ['id', 'r1'], ['x', '10'], ['y', '20'], ['width', '100'], ['height', '50'], ['fill', '#eee'],
    ]);
    assert.throws(() => Rect.fromArgs('r1', ['1', '2']), /usage: create rect/);
    assert.equal(Line.fromArgs('l', ['0', '0', '1', '1', 'black']).getAttribute('stroke'), 'black');
  });
});

describe('Group (Composite)', () => {
  function sample(): { doc: SvgDocument; outer: Group; inner: Group; rect: Rect; circle: Circle } {
    const doc = new SvgDocument();
    const outer = new Group('outer');
    const inner = new Group('inner');
    const rect = new Rect('r', 0, 0, 10, 10);
    const circle = new Circle('c', 5, 5, 2);
    doc.insert(outer);
    outer.insert(rect);
    outer.insert(inner);
    inner.insert(circle);
    return { doc, outer, inner, rect, circle };
  }

  it('forwards move and scale to every descendant', () => {
    const { outer, rect, circle } = sample();
    outer.move(10, 20);
    assert.deepEqual([rect.x, rect.y, circle.cx, circle.cy], [10, 20, 15, 25]);
    outer.scale(2);
    assert.deepEqual([rect.width, circle.r], [20, 4]);
  });

  it('composite memento restores the whole subtree', () => {
    const { outer, rect, circle } = sample();
    const memento = outer.createMemento();
    outer.scale(7);
    memento.restore();
    assert.deepEqual([rect.width, circle.cx], [10, 5]);
  });

  it('knows its descendants', () => {
    const { outer, inner, circle } = sample();
    assert.ok(outer.isAncestorOf(circle));
    assert.ok(!inner.isAncestorOf(outer));
    assert.ok(!circle.isAncestorOf(circle));
  });

  it('keeps parent pointers consistent', () => {
    const { doc, outer, rect } = sample();
    assert.equal(rect.parent, outer);
    assert.equal(outer.parent, doc);
    outer.remove(rect);
    assert.equal(rect.parent, null);
    assert.throws(() => outer.remove(rect));
  });
});

describe('SvgDocument', () => {
  it('finds shapes anywhere in the tree in document order', () => {
    const doc = new SvgDocument(400, 300);
    const g = new Group('g');
    doc.insert(g);
    g.insert(new Rect('deep', 0, 0, 1, 1));
    doc.insert(new Circle('top', 0, 0, 1));
    assert.deepEqual(doc.allShapes().map((s) => s.id), ['g', 'deep', 'top']);
    assert.equal(doc.require('deep').ref(), 'rect#deep');
    assert.throws(() => doc.require('nope'), /no such shape: nope/);
    assert.throws(() => doc.requireNewId('g'), /id already exists: g/);
    assert.throws(() => doc.requireContainer('top'), /not a container: top/);
    assert.throws(() => doc.requireContainer('x'), /no such container: x/);
    assert.equal(doc.sizeLabel(), '400x300');
  });

  it('rejects non-positive canvas sizes', () => {
    assert.throws(() => new SvgDocument(0, 10), EditorError);
  });
});
