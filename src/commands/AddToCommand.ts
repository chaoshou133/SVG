import type { Container } from '../model/Container';
import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';
import { Placement } from './Placement';

/** `addto <gid> <id>` — moves an existing shape into a container as its last child. */
export class AddToCommand implements Command {
  private placement: Placement | null = null;
  private container: Container | null = null;

  constructor(
    private readonly doc: SvgDocument,
    private readonly containerId: string,
    private readonly id: string,
  ) {}

  execute(): string {
    const container = this.doc.requireContainer(this.containerId);
    const shape = this.doc.require(this.id);
    this.rejectCycle(container, shape);
    this.placement = Placement.detach(shape);
    container.insert(shape);
    this.container = container;
    return `${shape.ref()} added to ${container.label()}`;
  }

  undo(): string {
    const placement = this.placement as Placement;
    (this.container as Container).remove(placement.shape);
    placement.restore();
    return `${placement.shape.ref()} returned to ${placement.parent.label()}`;
  }

  /** A container cannot be moved into itself or into one of its descendants. */
  private rejectCycle(container: Container, shape: Shape): void {
    const moved = shape.asContainer();
    for (let c: Container | null = container; c !== null; c = c.containerParent()) {
      if (c === moved) {
        throw new EditorError(`cannot group a container into its own descendant: ${shape.id}`);
      }
    }
  }
}
