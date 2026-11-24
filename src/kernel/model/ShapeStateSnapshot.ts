/**
 * Captures and restores a shape's mutable attribute/geometry/text state so
 * AttributeHandler transactions can atomically roll back on error and support
 * single-step undo/redo across multiple modified sub-parts.
 */
export interface ShapeStateSnapshot {
  restore(): void;
}
