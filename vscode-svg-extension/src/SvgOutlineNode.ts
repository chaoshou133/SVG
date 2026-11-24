/**
 * Immutable AST node produced by SvgOutlineParser with exact UTF-16 character
 * offsets so VSCode's DocumentSymbolProvider can map every node to source lines.
 */
export class SvgOutlineNode {
  constructor(
    readonly tagName: string,
    readonly id: string | null,
    readonly startOffset: number,
    readonly endOffset: number,
    readonly nameStartOffset: number,
    readonly nameEndOffset: number,
    readonly children: readonly SvgOutlineNode[],
  ) {}

  /** Display label in VSCode Outline: `tag#id` when id is non-empty, else `tag`. */
  label(): string {
    return this.id !== null && this.id !== '' ? `${this.tagName}#${this.id}` : this.tagName;
  }
}
