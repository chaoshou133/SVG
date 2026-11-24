import { SvgOutlineNode } from './SvgOutlineNode';

interface MutableElement {
  tagName: string;
  id: string | null;
  startOffset: number;
  nameStartOffset: number;
  nameEndOffset: number;
  children: SvgOutlineNode[];
}

/**
 * Zero-dependency, offset-preserving XML/SVG parser for VSCode Outline.
 *
 * Unlike Phase 1's XmlParser (which discards character offsets and skips
 * non-editor elements during SvgReader translation), this parser keeps exact
 * start/end offsets for all SVG elements and degrades gracefully to an empty
 * array when XML is incomplete or malformed during live editing.
 */
export class SvgOutlineParser {
  private pos = 0;
  private source = '';

  parse(source: string): SvgOutlineNode[] {
    this.source = source;
    this.pos = 0;
    try {
      return this.parseDocument();
    } catch {
      return [];
    }
  }

  private parseDocument(): SvgOutlineNode[] {
    const roots: SvgOutlineNode[] = [];
    const stack: MutableElement[] = [];

    while (this.pos < this.source.length) {
      const lt = this.source.indexOf('<', this.pos);
      if (lt === -1) {
        break;
      }
      this.pos = lt;

      if (this.startsWith('<!--')) {
        this.consumeUntil('-->');
      } else if (this.startsWith('<![CDATA[')) {
        this.consumeUntil(']]>');
      } else if (this.startsWith('<?')) {
        this.consumeUntil('?>');
      } else if (this.startsWith('<!')) {
        this.consumeDeclaration();
      } else if (this.startsWith('</')) {
        this.parseClosingTag(stack, roots);
      } else {
        this.parseOpeningTag(stack, roots);
      }
    }

    if (stack.length !== 0) {
      // Unclosed tag (incomplete XML during editing): clear outline without crashing.
      return [];
    }
    return roots;
  }

  private parseOpeningTag(stack: MutableElement[], roots: SvgOutlineNode[]): void {
    const startOffset = this.pos;
    this.pos += 1; // skip '<'
    const nameStartOffset = this.pos;
    const tagName = this.readName();
    if (tagName === '') {
      throw new Error('empty tag name');
    }
    const nameEndOffset = this.pos;

    let id: string | null = null;
    while (this.pos < this.source.length) {
      this.skipWhitespace();
      if (this.pos >= this.source.length) {
        throw new Error('unterminated start tag');
      }
      if (this.startsWith('/>')) {
        this.pos += 2;
        const node = new SvgOutlineNode(tagName, id, startOffset, this.pos, nameStartOffset, nameEndOffset, []);
        this.attach(node, stack, roots);
        return;
      }
      if (this.source[this.pos] === '>') {
        this.pos += 1;
        stack.push({ tagName, id, startOffset, nameStartOffset, nameEndOffset, children: [] });
        return;
      }
      const attrName = this.readName();
      if (attrName === '') {
        throw new Error('invalid attribute name');
      }
      this.skipWhitespace();
      if (this.source[this.pos] !== '=') {
        throw new Error('expected =');
      }
      this.pos += 1;
      this.skipWhitespace();
      const attrValue = this.readQuotedValue();
      if (attrName === 'id') {
        id = attrValue;
      }
    }
    throw new Error('unterminated start tag');
  }

  private parseClosingTag(stack: MutableElement[], roots: SvgOutlineNode[]): void {
    this.pos += 2; // skip '</'
    const tagName = this.readName();
    this.skipWhitespace();
    if (this.pos >= this.source.length || this.source[this.pos] !== '>') {
      throw new Error('unterminated closing tag');
    }
    this.pos += 1;

    const top = stack.pop();
    if (top === undefined || top.tagName !== tagName) {
      throw new Error('mismatched closing tag');
    }
    const node = new SvgOutlineNode(
      top.tagName,
      top.id,
      top.startOffset,
      this.pos,
      top.nameStartOffset,
      top.nameEndOffset,
      top.children,
    );
    this.attach(node, stack, roots);
  }

  private attach(node: SvgOutlineNode, stack: MutableElement[], roots: SvgOutlineNode[]): void {
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(node);
    } else {
      roots.push(node);
    }
  }

  private consumeUntil(marker: string): void {
    const end = this.source.indexOf(marker, this.pos + 2);
    if (end === -1) {
      throw new Error(`unterminated ${marker}`);
    }
    this.pos = end + marker.length;
  }

  private consumeDeclaration(): void {
    let depth = 0;
    this.pos += 2;
    while (this.pos < this.source.length) {
      const ch = this.source[this.pos];
      if (ch === '[') {
        depth += 1;
      } else if (ch === ']') {
        depth = Math.max(0, depth - 1);
      } else if (ch === '>' && depth === 0) {
        this.pos += 1;
        return;
      }
      this.pos += 1;
    }
    throw new Error('unterminated declaration');
  }

  private readName(): string {
    const start = this.pos;
    while (this.pos < this.source.length && /[A-Za-z0-9_.:-]/.test(this.source[this.pos])) {
      this.pos += 1;
    }
    return this.source.slice(start, this.pos);
  }

  private readQuotedValue(): string {
    const quote = this.source[this.pos];
    if (quote !== '"' && quote !== "'") {
      throw new Error('expected quote');
    }
    this.pos += 1;
    const start = this.pos;
    const end = this.source.indexOf(quote, start);
    if (end === -1) {
      throw new Error('unterminated attribute value');
    }
    const value = this.source.slice(start, end);
    this.pos = end + 1;
    return value;
  }

  private skipWhitespace(): void {
    while (this.pos < this.source.length && /\s/.test(this.source[this.pos])) {
      this.pos += 1;
    }
  }

  private startsWith(prefix: string): boolean {
    return this.source.startsWith(prefix, this.pos);
  }
}
