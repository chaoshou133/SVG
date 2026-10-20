import type { Shape } from '../model/Shape';

/** Renders `show <id>`: the full attribute list of one shape. */
export class ShowRenderer {
  render(shape: Shape): string[] {
    const lines = [`${shape.ref()}  parent=${shape.parent?.label() ?? '(detached)'}`];
    this.addLine(lines, shape.geometryEntries());
    const text = shape.textContent();
    if (text !== null) {
      lines.push(`  text="${text}"`);
    }
    const children = shape.asContainer()?.children();
    if (children !== undefined) {
      lines.push(`  children=${children.length}${children.length > 0 ? ` (${children.map((c) => c.id).join(' ')})` : ''}`);
    }
    this.addLine(lines, shape.styleEntries());
    this.addLine(lines, shape.extraEntries());
    return lines;
  }

  private addLine(lines: string[], entries: readonly [string, string][]): void {
    if (entries.length > 0) {
      lines.push(`  ${entries.map(([name, value]) => `${name}=${value}`).join(' ')}`);
    }
  }
}
