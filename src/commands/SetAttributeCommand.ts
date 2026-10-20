import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';

/** `set <id> <attr> <value>` — the whitelist is owned by each shape class. */
export class SetAttributeCommand implements Command {
  private shape: Shape | null = null;
  private previous: string | undefined;

  constructor(
    private readonly doc: SvgDocument,
    private readonly id: string,
    private readonly name: string,
    private readonly value: string,
  ) {}

  execute(): string {
    const shape = this.doc.require(this.id);
    const previous = shape.getAttribute(this.name);
    shape.setAttribute(this.name, this.value);
    this.shape = shape;
    this.previous = previous;
    return this.describe(this.value);
  }

  undo(): string {
    const shape = this.shape as Shape;
    if (this.previous === undefined) {
      shape.removeAttribute(this.name);
      return `${shape.ref()} updated: ${this.name} unset`;
    }
    shape.setAttribute(this.name, this.previous);
    return this.describe(this.previous);
  }

  private describe(value: string): string {
    const shown = this.name === 'text' ? `"${value}"` : value;
    return `${(this.shape as Shape).ref()} updated: ${this.name}=${shown}`;
  }
}
