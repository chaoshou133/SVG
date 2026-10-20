import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ShapeFactory } from '../src/factory/ShapeFactory';
import { SvgReader } from '../src/io/SvgReader';
import { SvgWriter } from '../src/io/SvgWriter';
import { XmlParser } from '../src/io/XmlParser';
import type { Text } from '../src/model/Text';

const OTHER_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>
`;

function read(source: string): { warnings: string[]; doc: ReturnType<SvgReader['read']> } {
  const warnings: string[] = [];
  const doc = new SvgReader(new ShapeFactory()).read(source, (w) => warnings.push(w));
  return { warnings, doc };
}

describe('XmlParser', () => {
  it('parses elements, attributes, entities, comments and CDATA', () => {
    const root = XmlParser.parse(
      `<?xml version="1.0"?><!DOCTYPE svg [<!ENTITY x "y">]><!-- c --><a k='1' j="&lt;&amp;&#65;&#x42;">t&gt;<b/><![CDATA[<raw>]]></a>`,
    );
    assert.equal(root.name, 'a');
    assert.equal(root.attributes.get('j'), '<&AB');
    assert.equal(root.elements()[0].name, 'b');
    assert.equal(root.textContent(), 't><raw>');
  });

  it('reports malformed input with a line number', () => {
    assert.throws(() => XmlParser.parse('<a>\n<b></a>'), /invalid svg: expected <\/b> but found <\/a> \(line 2\)/);
    assert.throws(() => XmlParser.parse('<a x="1" x="2"/>'), /duplicate attribute x/);
    assert.throws(() => XmlParser.parse('<a>'), /unclosed element <a>/);
    assert.throws(() => XmlParser.parse('hello'), /expected root element/);
  });
});

describe('SvgReader', () => {
  it('reads the spec example and assigns missing ids with a warning', () => {
    const { doc, warnings } = read(OTHER_SVG);
    assert.deepEqual(warnings, ['assigned id rect1 to unnamed <rect>']);
    assert.equal(doc.sizeLabel(), '400x300');
    assert.equal(doc.elementCount(), 7);
    assert.deepEqual(doc.allShapes().map((s) => s.ref()), ['rect#rect1', 'text#t1', 'circle#c1', 'g#g1', 'rect#r2', 'circle#c2', 'ellipse#e1']);
    assert.equal((doc.require('t1') as Text).text, 'imported');
    assert.equal(doc.require('rect1').getAttribute('fill'), '#ffffff');
  });

  it('never generates an id that appears later in the file, and fixes duplicates', () => {
    const { doc, warnings } = read(`<svg width="10" height="10"><rect/><rect id="rect1"/><circle id="rect1"/></svg>`);
    assert.deepEqual(doc.allShapes().map((s) => s.id), ['rect2', 'rect1', 'circle1']);
    assert.deepEqual(warnings, ['assigned id rect2 to unnamed <rect>', 'duplicate id rect1 on <circle>, reassigned to circle1']);
  });

  it('skips unsupported elements with a warning and preserves unknown attributes', () => {
    const { doc, warnings } = read(`<svg viewBox="0 0 50 40"><path d="M0 0"/><g id="g" transform="translate(1,2)"/></svg>`);
    assert.deepEqual(warnings, ['skipped unsupported element <path>']);
    assert.equal(doc.sizeLabel(), '50x40');
    assert.deepEqual(doc.require('g').extraEntries(), [['transform', 'translate(1,2)']]);
  });

  it('rejects a non-svg root', () => {
    assert.throws(() => read('<html/>'), /invalid svg: root element is <html>, expected <svg>/);
  });
});

describe('SvgWriter', () => {
  it('writes the format of the spec and round-trips through the reader', () => {
    const { doc } = read(OTHER_SVG);
    const text = new SvgWriter().write(doc);
    assert.equal(
      text,
      `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect id="rect1" x="0" y="0" width="400" height="300" fill="#ffffff"/>
  <text id="t1" x="10" y="290">imported</text>
  <circle id="c1" cx="50" cy="50" r="10"/>
  <g id="g1">
    <rect id="r2" x="0" y="0" width="10" height="10"/>
    <circle id="c2" cx="5" cy="5" r="2"/>
  </g>
  <ellipse id="e1" cx="1" cy="2" rx="3" ry="4"/>
</svg>
`,
    );
    const again = read(text);
    assert.deepEqual(again.warnings, []);
    assert.equal(new SvgWriter().write(again.doc), text);
  });

  it('escapes special characters in text and attributes', () => {
    const { doc } = read(`<svg width="1" height="1"><text id="t" x="0" y="0" font-family="&quot;A&quot;">a &lt; b &amp; c</text></svg>`);
    const text = new SvgWriter().write(doc);
    assert.match(text, /font-family="&quot;A&quot;">a &lt; b &amp; c<\/text>/);
  });
});
