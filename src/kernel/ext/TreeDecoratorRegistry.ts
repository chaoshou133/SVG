import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { TreeDecorator } from './TreeDecorator';

/**
 * Registry of TreeDecorator extensions.
 * Decorators are evaluated in deterministic registration order and joined with
 * single spaces at the end of each tree row.
 */
export class TreeDecoratorRegistry {
  private readonly decorators = new Map<string, TreeDecorator>();

  register(decorator: TreeDecorator): void {
    if (this.decorators.has(decorator.name)) {
      throw new EditorError(`duplicate registration: decorators/${decorator.name}`);
    }
    this.decorators.set(decorator.name, decorator);
  }

  has(name: string): boolean {
    return this.decorators.has(name);
  }

  labelsFor(shape: Shape | null, doc: SvgDocument): string[] {
    const labels: string[] = [];
    for (const decorator of this.decorators.values()) {
      const label = decorator.decorate(shape, doc);
      if (label !== null && label !== '') {
        labels.push(label);
      }
    }
    return labels;
  }
}
