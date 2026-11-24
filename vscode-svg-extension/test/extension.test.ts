import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it } from 'node:test';
import { SvgBadgeRule } from '../src/SvgBadgeRule';
import { SvgOutlineParser } from '../src/SvgOutlineParser';

const FIXTURES = resolve(__dirname, '..', '..', 'fixtures');

function offsetToLine(text: string, offset: number): number {
  return text.slice(0, offset).split('\n').length; // 1-based line number
}

describe('A.1 SvgBadgeRule (Explorer [] file decoration)', () => {
  const rule = new SvgBadgeRule();

  it('decorates regular .svg files (case-insensitive) with []', () => {
    assert.deepEqual(rule.evaluate('/workspace/example.svg', false), {
      badge: '[]',
      tooltip: 'SVG Vector File',
    });
    assert.deepEqual(rule.evaluate('C:\\demo\\DIAGRAM.SVG', false), {
      badge: '[]',
      tooltip: 'SVG Vector File',
    });
  });

  it('does not decorate non-SVG files or directories (even if named *.svg)', () => {
    assert.equal(rule.evaluate('/workspace/plain.txt', false), null);
    assert.equal(rule.evaluate('/workspace/svg.json', false), null);
    assert.equal(rule.evaluate('/workspace/docs', true), null);
    assert.equal(rule.evaluate('/workspace/fake.svg', true), null);
  });
});

describe('A.2 SvgOutlineParser (native Outline hierarchy, jump ranges, edits, malformed XML)', () => {
  const parser = new SvgOutlineParser();

  it('parses nested groups, id and non-id elements, and accurate source line ranges', () => {
    const svg = readFileSync(resolve(FIXTURES, 'example.svg'), 'utf8');
    const roots = parser.parse(svg);

    assert.equal(roots.length, 1);
    const root = roots[0];
    assert.equal(root.label(), 'svg');
    assert.equal(offsetToLine(svg, root.startOffset), 1);
    assert.equal(root.children.length, 1);

    const flow = root.children[0];
    assert.equal(flow.label(), 'g#flow');
    assert.equal(offsetToLine(svg, flow.nameStartOffset), 2);
    assert.equal(flow.children.length, 2);

    const startRect = flow.children[0];
    assert.equal(startRect.label(), 'rect#start');
    assert.equal(offsetToLine(svg, startRect.startOffset), 3);
    assert.equal(svg.slice(startRect.nameStartOffset, startRect.nameEndOffset), 'rect');

    const nested = flow.children[1];
    assert.equal(nested.label(), 'g#nested');
    assert.deepEqual(nested.children.map((c) => c.label()), ['text', 'circle#dot']);
    assert.equal(offsetToLine(svg, nested.children[0].startOffset), 5);
  });

  it('updates outline when document content is edited', () => {
    const before = `<svg width="100" height="100"><rect id="a"/></svg>`;
    const after = `<svg width="100" height="100"><rect id="a"/><g id="box"><text>New</text></g></svg>`;

    const beforeTree = parser.parse(before);
    assert.deepEqual(beforeTree[0].children.map((c) => c.label()), ['rect#a']);

    const afterTree = parser.parse(after);
    assert.deepEqual(afterTree[0].children.map((c) => c.label()), ['rect#a', 'g#box']);
    assert.deepEqual(afterTree[0].children[1].children.map((c) => c.label()), ['text']);
  });

  it('handles comments, XML prolog, DOCTYPE, CDATA, and single-quoted ids', () => {
    const svg = `<?xml version="1.0"?>
<!DOCTYPE svg>
<!-- leading comment -->
<svg width="200" height="100">
  <g id='main'><text><![CDATA[<ignored/>]]></text></g>
</svg>`;
    const roots = parser.parse(svg);
    assert.equal(roots.length, 1);
    assert.equal(roots[0].children[0].label(), 'g#main');
    assert.equal(roots[0].children[0].children[0].label(), 'text');
  });

  it('gracefully clears outline without crashing on incomplete or malformed XML', () => {
    const brokenFixture = readFileSync(resolve(FIXTURES, 'broken.svg'), 'utf8');
    const malformedSamples = [
      brokenFixture,
      '',
      '   ',
      '<svg><g id="a"><rect id="r"/></svg>', // mismatched closing tag
      '<svg><rect id="unterminated',          // truncated mid-attribute
      '<svg><g></g></g></svg>',              // extra closing tag
      '<svg><rect id=noquotes/></svg>',      // unquoted attribute
    ];
    for (const sample of malformedSamples) {
      assert.deepEqual(parser.parse(sample), []);
    }
  });
});
