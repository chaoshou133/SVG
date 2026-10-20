import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BufferOutput } from '../src/cli/BufferOutput';
import { Editor } from '../src/cli/Editor';
import { MemoryFileSystem } from './support/MemoryFileSystem';
import { Transcript } from './support/Transcript';

/** Replays every step of a transcript and compares the editor's output with the recording. */
function replay(fixture: string, fs: MemoryFileSystem, normalize: (line: string) => string = (line) => line): void {
  const out = new BufferOutput();
  const editor = new Editor(fs, out);
  for (const step of Transcript.parse(Transcript.fixture(fixture))) {
    editor.execute(step.command);
    assert.deepEqual(out.take().map(normalize), step.expected.map(normalize), `output of: svg> ${step.command}`);
  }
}

describe('requirements §6 sessions replay exactly', () => {
  it('§6 typical session (byte-for-byte, including tree alignment)', () => {
    const fs = new MemoryFileSystem({ 'other.svg': Transcript.fixture('other.svg') });
    replay('spec-session.txt', fs);
    assert.ok(fs.files.has('demo.svg'));
  });

  it('§6.1 flowchart session (tree column alignment ignored)', () => {
    // The spec's own tree here is not column-aligned (some rows are offset by
    // one space), so this replay compares with whitespace runs collapsed.
    const fs = new MemoryFileSystem();
    replay('spec-flowchart.txt', fs, (line) => line.replace(/\s+/g, ' '));
    const saved = fs.files.get('flowchart.svg') as string;
    assert.match(saved, /<g id="node2">\n {6}<rect id="process" x="520" y="100" width="160" height="60" fill="#f5a623"\/>/);
    assert.match(saved, /<text id="process-label" x="545" y="135">处理数据 v2<\/text>/);
  });
});
