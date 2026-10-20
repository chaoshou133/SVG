import type { Container } from '../model/Container';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';

/** `create <type> <id> … [in <containerId>]` */
export class CreateShapeCommand implements Command {
  private target: Container | null = null;

  constructor(
    private readonly doc: SvgDocument,
    private readonly shape: Shape,
    private readonly containerId: string | null,
  ) {}

  execute(): string {
    this.doc.requireNewId(this.shape.id);
    const target = this.containerId === null ? this.doc : this.doc.requireContainer(this.containerId);
    target.insert(this.shape);
    this.target = target;
    const where = this.containerId === null ? '' : ` in ${target.label()}`;
    return `${this.shape.ref()} created${where}`;
  }

  undo(): string {
    (this.target as Container).remove(this.shape);
    return `${this.shape.ref()} creation undone`;
  }
}
