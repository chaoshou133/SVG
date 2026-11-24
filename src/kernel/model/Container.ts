import type { Shape } from './Shape';

/**
 * Anything that holds child shapes: the document root (`<svg>`) and containers (`<g>`, `box`, ...).
 * Commands that restructure the tree work against this interface only.
 */
export interface Container {
  children(): readonly Shape[];
  indexOf(shape: Shape): number;
  /** Inserts at `index` (default: append). The shape must be detached. */
  insert(shape: Shape, index?: number): void;
  /** Detaches the shape and returns the index it had. */
  remove(shape: Shape): number;
  /** Display reference such as `svg` or `g#markers`. */
  label(): string;
  /** The container holding this one, or null for the document root. */
  containerParent(): Container | null;
  isDocumentRoot(): boolean;
  /** Hook allowing composite containers (e.g. box) to guard essential children. */
  assertCanDetachChild(child: Shape): void;
}
