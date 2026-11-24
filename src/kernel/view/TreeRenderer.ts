import type { TreeDecoratorRegistry } from '../ext/TreeDecoratorRegistry';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';

interface TreeRow {
  head: string;
  detail: string;
  tags: string;
}

/**
 * Renders `tree`: box-drawing structure with inline geometry aligned in one
 * column, plus optional trailing labels supplied by registered TreeDecorators.
 *
 * When no decorators are registered, output is byte-for-byte identical to Phase 1.
 */
export class TreeRenderer {
  private static readonly GAP = 2;

  constructor(private readonly decorators?: TreeDecoratorRegistry) {}

  renderDocument(doc: SvgDocument): string[] {
    const rows: TreeRow[] = [
      { head: `svg (${doc.sizeLabel()})`, detail: '', tags: this.tagsFor(null, doc) },
    ];
    this.addChildren(doc.children(), '', doc, rows);
    return this.layout(rows);
  }

  renderSubtree(shape: Shape, doc: SvgDocument): string[] {
    const rows: TreeRow[] = [
      { head: shape.ref(), detail: shape.summary(), tags: this.tagsFor(shape, doc) },
    ];
    this.addChildren(shape.asContainer()?.children() ?? [], '', doc, rows);
    return this.layout(rows);
  }

  private addChildren(children: readonly Shape[], indent: string, doc: SvgDocument, rows: TreeRow[]): void {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      rows.push({
        head: `${indent}${last ? '└── ' : '├── '}${child.ref()}`,
        detail: child.summary(),
        tags: this.tagsFor(child, doc),
      });
      this.addChildren(child.asContainer()?.children() ?? [], `${indent}${last ? '    ' : '│   '}`, doc, rows);
    });
  }

  private tagsFor(shape: Shape | null, doc: SvgDocument): string {
    if (this.decorators === undefined) {
      return '';
    }
    return this.decorators.labelsFor(shape, doc).join(' ');
  }

  private layout(rows: readonly TreeRow[]): string[] {
    const column = Math.max(...rows.map((row) => row.head.length)) + TreeRenderer.GAP;
    return rows.map((row) => {
      const base = row.detail === '' ? row.head : row.head.padEnd(column) + row.detail;
      return row.tags === '' ? base : `${base} ${row.tags}`;
    });
  }
}
