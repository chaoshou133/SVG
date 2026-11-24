import type { AttributeContext } from './AttributeContext';
import type { AttributeResult } from './AttributeResult';

/**
 * Extension Point 4 (`AttributeHandler`):
 * Defines domain-specific semantics when `set <id> <attr> <value>` targets a shape.
 *
 * Contract:
 *  - `handles` MUST be pure (never mutate document state).
 *  - `apply` executes inside a kernel-managed state snapshot transaction:
 *    if `apply` throws, all partial mutations are rolled back automatically,
 *    history stays untouched, and default attribute handling is NOT invoked.
 *  - On conflict (multiple handlers match), higher `priority` (default 0) wins;
 *    ties at the highest priority are rejected with EditorError.
 */
export interface AttributeHandler {
  readonly name: string;
  readonly priority?: number;
  handles(shapeId: string, attr: string, ctx: AttributeContext): boolean;
  apply(shapeId: string, attr: string, value: string, ctx: AttributeContext): AttributeResult;
}
