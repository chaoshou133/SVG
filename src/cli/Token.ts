/** One command-line word. `quoted` distinguishes `"in"` (text) from the `in` keyword. */
export class Token {
  constructor(
    readonly value: string,
    readonly quoted: boolean,
  ) {}

  isKeyword(word: string): boolean {
    return !this.quoted && this.value === word;
  }
}
