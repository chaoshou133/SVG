/** Where the editor writes its feedback. Adds the `warning:` / `error:` prefixes. */
export interface Output {
  info(line: string): void;
  warn(message: string): void;
  error(message: string): void;
}
