import type { Container } from '../model/Container';
import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';
import { Placement } from './Placement';

/** `ungroup <gid>` — children move up to the group's parent, taking the group's place. */
export class UngroupCommand implements Command {
  private placement: Placement | null = null;
  private container: Container | null = null;
  private children: Shape[] = [];

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
  ) {}

  execute(): string {
    const shape = this.doc.require(this.id);
    const container = shape.asContainer();
    if (container === null) {
      throw new EditorError(`not a container: ${this.id}`);
    }
    if ((shape.parent as Container).isDocumentRoot()) {
      throw new EditorError(`cannot ungroup top-level container: ${this.id}`);
    }
    const placement = Placement.detach(shape);
    const children = [...container.children()];
    children.forEach((child, offset) => {
      container.remove(child);
      placement.parent.insert(child, placement.index + offset);
    });
    this.placement = placement;
    this.container = container;
    this.children = children;
    return `${shape.ref()} ungrouped (${children.length} children moved to ${placement.parent.label()})`;
  }

  undo(): string {
    const placement = this.placement as Placement;
    const container = this.container as Container;
    for (const child of this.children) {
      placement.parent.remove(child);
      container.insert(child);
    }
    placement.restore();
    return `${placement.shape.ref()} regrouped (${this.children.length} children)`;
  }
}
