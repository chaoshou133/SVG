/** Feedback messages returned by an AttributeHandler upon successful mutation. */
export interface AttributeResult {
  readonly executeMessage: string;
  readonly undoMessage: string;
}
