import { EditorError } from '../model/EditorError';
import type { AttributeContext } from './AttributeContext';
import type { AttributeHandler } from './AttributeHandler';

/**
 * Registry of AttributeHandler extensions.
 * Conflict resolution contract (ADR-01):
 *  - Query all registered handlers via `handles(shapeId, attr, ctx)`.
 *  - 0 matches → return null (kernel falls back to Phase 1 default whitelist).
 *  - ≥1 matches → choose highest `priority` (default 0).
 *  - Tie at highest priority → reject with EditorError (no silent overwrite).
 */
export class AttributeHandlerRegistry {
  private readonly handlers = new Map<string, AttributeHandler>();

  register(handler: AttributeHandler): void {
    if (this.handlers.has(handler.name)) {
      throw new EditorError(`duplicate registration: attributes/${handler.name}`);
    }
    this.handlers.set(handler.name, handler);
  }

  has(name: string): boolean {
    return this.handlers.has(name);
  }

  resolve(shapeId: string, attr: string, ctx: AttributeContext): AttributeHandler | null {
    const matched: AttributeHandler[] = [];
    for (const handler of this.handlers.values()) {
      if (handler.handles(shapeId, attr, ctx)) {
        matched.push(handler);
      }
    }
    if (matched.length === 0) {
      return null;
    }
    if (matched.length === 1) {
      return matched[0];
    }
    const maxPriority = Math.max(...matched.map((h) => h.priority ?? 0));
    const winners = matched.filter((h) => (h.priority ?? 0) === maxPriority);
    if (winners.length > 1) {
      const names = winners.map((h) => h.name).join(', ');
      throw new EditorError(`ambiguous attribute handlers for ${shapeId}.${attr}: ${names}`);
    }
    return winners[0];
  }
}
