import type { Container } from '../model/Container';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';

/** `delete <id>` — a container is removed together with its whole subtree. */
export class DeleteCommand implements Command {
  private shape: Shape | null = null;
  private parent: Container | null = null;
  private index = 0;

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
  ) {}

  execute(): string {
    const shape = this.doc.require(this.id);
    const parent = shape.parent as Container;
    this.index = parent.remove(shape);
    this.shape = shape;
    this.parent = parent;
    return `${shape.ref()} deleted`;
  }

  undo(): string {
    const shape = this.shape as Shape;
    const parent = this.parent as Container;
    parent.insert(shape, this.index);
    return `${shape.ref()} restored into ${parent.label()}`;
  }
}
