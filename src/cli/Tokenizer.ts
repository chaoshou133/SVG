import { EditorError } from '../model/EditorError';
import { Token } from './Token';

/**
 * Splits a command line on whitespace. Double quotes group words containing
 * spaces; inside quotes `\"` and `\\` are escapes.
 */
export class Tokenizer {
  tokenize(line: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;
    while (i < line.length) {
      if (/\s/.test(line[i])) {
        i++;
      } else if (line[i] === '"') {
        i = this.readQuoted(line, i + 1, tokens);
      } else {
        const start = i;
        while (i < line.length && !/\s/.test(line[i])) {
          i++;
        }
        tokens.push(new Token(line.slice(start, i), false));
      }
    }
    return tokens;
  }

  private readQuoted(line: string, start: number, tokens: Token[]): number {
    let value = '';
    for (let i = start; i < line.length; i++) {
      const ch = line[i];
      if (ch === '\\' && (line[i + 1] === '"' || line[i + 1] === '\\')) {
        value += line[++i];
      } else if (ch === '"') {
        tokens.push(new Token(value, true));
        return i + 1;
      } else {
        value += ch;
      }
    }
    throw new EditorError('unterminated quote');
  }
}
