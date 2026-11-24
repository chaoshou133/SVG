/** Opaque geometry snapshot restored by move/scale undo (Memento pattern). */
export interface ShapeMemento {
  restore(): void;
}
