import { EditorError } from '../model/EditorError';
import { XmlElement } from './XmlElement';
import { XmlText } from './XmlText';

/**
 * Minimal dependency-free XML parser, sufficient for SVG files:
 * elements, attributes, text, entities, CDATA; skips the XML declaration,
 * processing instructions, comments and DOCTYPE. No namespace processing.
 */
export class XmlParser {
  private static readonly NAME = /[A-Za-z_:][-A-Za-z0-9_:.]*/y;
  private static readonly ENTITIES: Readonly<Record<string, string>> = {
    lt: '<',
    gt: '>',
    amp: '&',
    quot: '"',
    apos: "'",
  };

  private pos = 0;

  private constructor(private readonly src: string) {}

  /** Parses a document and returns its root element; throws `invalid svg: …` on malformed input. */
  static parse(source: string): XmlElement {
    return new XmlParser(source.replace(/^﻿/, '')).parseDocument();
  }

  static decodeEntities(text: string): string {
    return text.replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[A-Za-z]+);/g, (whole, body: string) => {
      if (body.startsWith('#x')) {
        return String.fromCodePoint(parseInt(body.slice(2), 16));
      }
      if (body.startsWith('#')) {
        return String.fromCodePoint(parseInt(body.slice(1), 10));
      }
      return XmlParser.ENTITIES[body] ?? whole;
    });
  }

  private parseDocument(): XmlElement {
    this.skipMisc();
    if (!this.at('<')) {
      this.fail('expected root element');
    }
    const root = this.parseElement();
    this.skipMisc();
    if (this.pos < this.src.length) {
      this.fail('unexpected content after root element');
    }
    return root;
  }

  /** Skips whitespace, comments, processing instructions and DOCTYPE between top-level nodes. */
  private skipMisc(): void {
    for (;;) {
      this.skipWhitespace();
      if (this.at('<?')) {
        this.skipPast('?>');
      } else if (this.at('<!--')) {
        this.skipPast('-->');
      } else if (this.at('<!DOCTYPE')) {
        this.skipDoctype();
      } else {
        return;
      }
    }
  }

  private parseElement(): XmlElement {
    this.expect('<');
    const element = new XmlElement(this.readName());
    for (;;) {
      this.skipWhitespace();
      if (this.at('/>')) {
        this.pos += 2;
        return element;
      }
      if (this.at('>')) {
        this.pos += 1;
        break;
      }
      this.parseAttribute(element);
    }
    this.parseContent(element);
    return element;
  }

  private parseAttribute(element: XmlElement): void {
    const name = this.readName();
    this.skipWhitespace();
    this.expect('=');
    this.skipWhitespace();
    const quote = this.src[this.pos];
    if (quote !== '"' && quote !== "'") {
      this.fail(`expected quoted value for attribute ${name}`);
    }
    const end = this.src.indexOf(quote, this.pos + 1);
    if (end < 0) {
      this.fail(`unterminated value for attribute ${name}`);
    }
    if (element.attributes.has(name)) {
      this.fail(`duplicate attribute ${name}`);
    }
    element.attributes.set(name, XmlParser.decodeEntities(this.src.slice(this.pos + 1, end)));
    this.pos = end + 1;
  }

  private parseContent(element: XmlElement): void {
    for (;;) {
      if (this.pos >= this.src.length) {
        this.fail(`unclosed element <${element.name}>`);
      }
      if (this.at('</')) {
        this.pos += 2;
        const name = this.readName();
        if (name !== element.name) {
          this.fail(`expected </${element.name}> but found </${name}>`);
        }
        this.skipWhitespace();
        this.expect('>');
        return;
      }
      if (this.at('<!--')) {
        this.skipPast('-->');
      } else if (this.at('<![CDATA[')) {
        const end = this.indexOrFail(']]>', this.pos + 9);
        element.children.push(new XmlText(this.src.slice(this.pos + 9, end)));
        this.pos = end + 3;
      } else if (this.at('<?')) {
        this.skipPast('?>');
      } else if (this.at('<')) {
        element.children.push(this.parseElement());
      } else {
        const end = this.src.indexOf('<', this.pos);
        const stop = end < 0 ? this.src.length : end;
        element.children.push(new XmlText(XmlParser.decodeEntities(this.src.slice(this.pos, stop))));
        this.pos = stop;
      }
    }
  }

  private skipDoctype(): void {
    let depth = 0;
    for (; this.pos < this.src.length; this.pos++) {
      const ch = this.src[this.pos];
      if (ch === '[') {
        depth++;
      } else if (ch === ']') {
        depth--;
      } else if (ch === '>' && depth === 0) {
        this.pos++;
        return;
      }
    }
    this.fail('unterminated DOCTYPE');
  }

  private readName(): string {
    XmlParser.NAME.lastIndex = this.pos;
    const match = XmlParser.NAME.exec(this.src);
    if (match === null) {
      this.fail('expected a name');
    }
    this.pos += match[0].length;
    return match[0];
  }

  private skipWhitespace(): void {
    while (this.pos < this.src.length && /\s/.test(this.src[this.pos])) {
      this.pos++;
    }
  }

  private skipPast(token: string): void {
    this.pos = this.indexOrFail(token, this.pos) + token.length;
  }

  private indexOrFail(token: string, from: number): number {
    const index = this.src.indexOf(token, from);
    if (index < 0) {
      this.fail(`missing ${token}`);
    }
    return index;
  }

  private at(token: string): boolean {
    return this.src.startsWith(token, this.pos);
  }

  private expect(token: string): void {
    if (!this.at(token)) {
      this.fail(`expected '${token}'`);
    }
    this.pos += token.length;
  }

  private fail(message: string): never {
    const line = this.src.slice(0, this.pos).split('\n').length;
    throw new EditorError(`invalid svg: ${message} (line ${line})`);
  }
}
