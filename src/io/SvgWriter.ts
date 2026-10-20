import { Num } from '../model/Num';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';

/** SvgDocument → pretty-printed SVG text that browsers can open directly. */
export class SvgWriter {
  private static readonly INDENT = '  ';

  write(doc: SvgDocument): string {
    const w = Num.format(doc.width);
    const h = Num.format(doc.height);
    const lines = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">`,
    ];
    for (const shape of doc.children()) {
      this.writeShape(shape, 1, lines);
    }
    lines.push('</svg>');
    return lines.join('\n') + '\n';
  }

  private writeShape(shape: Shape, depth: number, lines: string[]): void {
    const indent = SvgWriter.INDENT.repeat(depth);
    const attributes = shape
      .svgAttributes()
      .map(([name, value]) => ` ${name}="${SvgWriter.escapeAttribute(value)}"`)
      .join('');
    const open = `${indent}<${shape.tagName}${attributes}`;
    const children = shape.asContainer()?.children() ?? [];
    const text = shape.textContent();
    if (children.length > 0) {
      lines.push(`${open}>`);
      for (const child of children) {
        this.writeShape(child, depth + 1, lines);
      }
      lines.push(`${indent}</${shape.tagName}>`);
    } else if (text !== null) {
      lines.push(`${open}>${SvgWriter.escapeText(text)}</${shape.tagName}>`);
    } else {
      lines.push(`${open}/>`);
    }
  }

  private static escapeText(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  private static escapeAttribute(value: string): string {
    return SvgWriter.escapeText(value).replace(/"/g, '&quot;');
  }
}
