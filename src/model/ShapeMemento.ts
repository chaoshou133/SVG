/**
 * Memento: an opaque snapshot of a shape's geometry (recursively for groups).
 * Undo restores the snapshot instead of applying an inverse operation,
 * so `scale 3` followed by `undo` is exact despite floating point.
 */
export interface ShapeMemento {
  restore(): void;
}
