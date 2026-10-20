import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One `svg> command` of a recorded session and the output lines that followed it. */
export interface TranscriptStep {
  command: string;
  expected: string[];
}

/**
 * Parses a session transcript as written in the requirements: everything
 * before the first prompt is the banner, blank lines and `#` comment lines
 * between steps are ignored.
 */
export class Transcript {
  static readonly FIXTURES = join(__dirname, '..', '..', '..', 'test', 'fixtures');

  static fixture(name: string): string {
    return readFileSync(join(Transcript.FIXTURES, name), 'utf8');
  }

  static parse(text: string): TranscriptStep[] {
    const steps: TranscriptStep[] = [];
    for (const line of text.split(/\r?\n/)) {
      if (line.startsWith('svg> ')) {
        steps.push({ command: line.slice(5), expected: [] });
      } else if (steps.length > 0 && line.trim() !== '' && !line.startsWith('#')) {
        steps[steps.length - 1].expected.push(line);
      }
    }
    return steps;
  }
}
