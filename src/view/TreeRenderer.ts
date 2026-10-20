import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import { ShapeSummaryVisitor } from './ShapeSummaryVisitor';

interface TreeRow {
  head: string;
  detail: string;
}

/**
 * Renders `tree`: box-drawing structure with the geometry of every node
 * inlined and aligned in one column.
 */
export class TreeRenderer {
  private static readonly GAP = 2;
  private readonly summary = new ShapeSummaryVisitor();

  renderDocument(doc: SvgDocument): string[] {
    const rows: TreeRow[] = [{ head: `svg (${doc.sizeLabel()})`, detail: '' }];
    this.addChildren(doc.children(), '', rows);
    return this.layout(rows);
  }

  renderSubtree(shape: Shape): string[] {
    const rows: TreeRow[] = [{ head: shape.ref(), detail: shape.accept(this.summary) }];
    this.addChildren(shape.asContainer()?.children() ?? [], '', rows);
    return this.layout(rows);
  }

  private addChildren(children: readonly Shape[], indent: string, rows: TreeRow[]): void {
    children.forEach((child, index) => {
      const last = index === children.length - 1;
      rows.push({ head: `${indent}${last ? '└── ' : '├── '}${child.ref()}`, detail: child.accept(this.summary) });
      this.addChildren(child.asContainer()?.children() ?? [], `${indent}${last ? '    ' : '│   '}`, rows);
    });
  }

  private layout(rows: readonly TreeRow[]): string[] {
    const column = Math.max(...rows.map((row) => row.head.length)) + TreeRenderer.GAP;
    return rows.map((row) => (row.detail === '' ? row.head : row.head.padEnd(column) + row.detail));
  }
}
