import { ConsoleOutput } from './cli/ConsoleOutput';
import { Editor } from './cli/Editor';
import { Repl } from './cli/Repl';
import { NodeFileSystem } from './io/NodeFileSystem';

// Composition root: the only place that picks concrete IO implementations.
new Repl(new Editor(new NodeFileSystem(), new ConsoleOutput())).start();
