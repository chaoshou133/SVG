#!/usr/bin/env node
/**
 * Generates `docs/metrics/metrics.md` and `docs/metrics/metrics.json` directly
 * from Git history, comparing baseline tag `final` (Phase 1) against `HEAD` (Phase 2).
 *
 * Scope:
 *  - CLI TypeScript source files split into: kernel (`src/kernel/`), host (`src/host/` + `src/main.ts`),
 *    and plugins (`plugins/`).
 *  - VSCode extension (`vscode-svg-extension/src/`) reported in a separate section
 *    so it is never mixed into CLI refactoring deltas.
 *  - Excludes `node_modules/`, `dist/`, tests, and lock files.
 */

import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: ROOT, encoding: 'utf8' }).trim();
}

function listTsFilesAt(ref) {
  const out = git(`ls-tree -r --name-only ${ref}`);
  return out
    .split(/\r?\n/)
    .filter((f) => f.endsWith('.ts') && !f.startsWith('test/') && !f.includes('/test/') && !f.includes('node_modules/') && !f.includes('dist/'));
}

function readFileAt(ref, filePath) {
  return git(`show ${ref}:${filePath}`);
}

/** Counts non-empty lines and estimates McCabe cyclomatic complexity per file. */
function analyzeSource(source) {
  const lines = source.split(/\r?\n/);
  const totalLines = lines.length;
  const codeLines = lines.filter((l) => {
    const t = l.trim();
    return t !== '' && !t.startsWith('//') && !t.startsWith('*') && !t.startsWith('/*');
  }).length;

  // Strip strings and comments before counting branch points
  const stripped = source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '')
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`/g, '""');

  const branchPatterns = [
    /\bif\s*\(/g,
    /\belse\s+if\s*\(/g,
    /\bfor\s*\(/g,
    /\bwhile\s*\(/g,
    /\bcase\b/g,
    /\bcatch\s*\(/g,
    /\?\s*[^:?]/g,
    /&&/g,
    /\|\|/g,
    /\?\?/g,
  ];
  let decisionPoints = 0;
  for (const re of branchPatterns) {
    const m = stripped.match(re);
    if (m) decisionPoints += m.length;
  }
  const complexity = 1 + decisionPoints;
  return { totalLines, codeLines, complexity };
}

function classifyFile(filePath, ref) {
  if (filePath.startsWith('vscode-svg-extension/src/')) return 'vscode';
  if (filePath.startsWith('plugins/')) return 'plugins';
  if (filePath.startsWith('src/host/') || filePath === 'src/main.ts') return 'host';
  if (filePath.startsWith('src/kernel/')) return 'kernel';
  // Phase 1 (`final`) layout before plugin refactoring
  if (ref === 'final' && filePath.startsWith('src/')) {
    if (filePath === 'src/main.ts') return 'host';
    return 'kernel';
  }
  return 'other';
}

function collectRef(ref) {
  const files = listTsFilesAt(ref);
  const entries = [];
  for (const file of files) {
    const category = classifyFile(file, ref);
    if (category === 'other') continue;
    const stats = analyzeSource(readFileAt(ref, file));
    entries.push({ file, category, ...stats });
  }
  const summarize = (cat) => {
    const list = entries.filter((e) => e.category === cat);
    return {
      files: list.length,
      totalLines: list.reduce((a, b) => a + b.totalLines, 0),
      codeLines: list.reduce((a, b) => a + b.codeLines, 0),
      complexity: list.reduce((a, b) => a + b.complexity, 0),
    };
  };
  const kernel = summarize('kernel');
  const host = summarize('host');
  const plugins = summarize('plugins');
  const vscode = summarize('vscode');
  const cliTotal = {
    files: kernel.files + host.files + plugins.files,
    totalLines: kernel.totalLines + host.totalLines + plugins.totalLines,
    codeLines: kernel.codeLines + host.codeLines + plugins.codeLines,
    complexity: kernel.complexity + host.complexity + plugins.complexity,
  };
  return { ref, commit: git(`rev-parse --short ${ref}`), kernel, host, plugins, cliTotal, vscode, entries };
}

function describeRole(file) {
  if (file.startsWith('src/kernel/model/')) return '内核领域模型抽象';
  if (file.startsWith('src/kernel/ext/')) return '内核扩展点接口 / 注册表 / 插件事务管理';
  if (file.startsWith('src/kernel/commands/')) return '内核可撤销编辑命令与历史栈';
  if (file.startsWith('src/kernel/io/')) return '内核 IO 端口、XML 解析与 SVG 读写';
  if (file.startsWith('src/kernel/view/')) return '内核视图渲染器（tree / show）';
  if (file.startsWith('src/kernel/cli/')) return '内核会话、词法分析与 REPL 驱动';
  if (file.startsWith('src/host/') || file === 'src/main.ts') return '宿主装配、适配器实现与配置加载器';
  if (file.startsWith('plugins/builtin-shapes/')) return '内置图形插件（6 种 Phase 1 基础图形）';
  if (file.startsWith('plugins/builtin-commands/')) return '内置命令插件（20 条 Phase 1 基础命令）';
  if (file.startsWith('plugins/plugin-cmd-stats/')) return '外部命令插件：stats 图形统计';
  if (file.startsWith('plugins/plugin-cmd-dir/')) return '外部命令插件：dir 目录查看（经 DirectoryAccess 适配器）';
  if (file.startsWith('plugins/plugin-shape-box/')) return '外部复合图形插件：box（Shape + Attribute + TreeDecorator）';
  if (file.startsWith('plugins/plugin-tree-star/')) return '外部树标签插件：modified-star（脏状态星标）';
  if (file.startsWith('vscode-svg-extension/src/')) return 'VSCode 扩展：文件 [] 标记与原生 SVG 大纲';
  return '源码文件';
}

const baseline = collectRef('final');
const current = collectRef('HEAD');

const delta = {
  files: current.cliTotal.files - baseline.cliTotal.files,
  totalLines: current.cliTotal.totalLines - baseline.cliTotal.totalLines,
  codeLines: current.cliTotal.codeLines - baseline.cliTotal.codeLines,
  complexity: current.cliTotal.complexity - baseline.cliTotal.complexity,
  kernelComplexityDelta: current.kernel.complexity - baseline.kernel.complexity,
};

const fmtDelta = (n) => (n >= 0 ? `+${n}` : `${n}`);

const md = [
  '# 代码度量报告（自动从 Git 历史生成）',
  '',
  `- **基线版本**：\`final\`（commit \`${baseline.commit}\`）`,
  `- **当前版本**：\`HEAD\`（commit \`${current.commit}\`）`,
  `- **生成脚本**：\`scripts/generate-metrics.mjs\`（排除 \`node_modules/\`、\`dist/\`、测试与锁文件；VSCode 扩展单独列出不混入 CLI 重构增量）`,
  '',
  '## 1. CLI 架构三层拆分汇总（内核 / 装配处 / 插件）',
  '',
  '| 分类 | 文件数 | 总行数 | 有效代码行 | 圈复杂度总和 | 相比 `final` 圈复杂度变化 |',
  '|---|---:|---:|---:|---:|---:|',
  `| **内核 (\`src/kernel/\`)** | ${current.kernel.files} | ${current.kernel.totalLines} | ${current.kernel.codeLines} | ${current.kernel.complexity} | ${fmtDelta(delta.kernelComplexityDelta)} (基线 ${baseline.kernel.complexity}) |`,
  `| **装配处 (\`src/host/\` + \`src/main.ts\`)** | ${current.host.files} | ${current.host.totalLines} | ${current.host.codeLines} | ${current.host.complexity} | ${fmtDelta(current.host.complexity - baseline.host.complexity)} (基线 ${baseline.host.complexity}) |`,
  `| **插件 (\`plugins/\`)** | ${current.plugins.files} | ${current.plugins.totalLines} | ${current.plugins.codeLines} | ${current.plugins.complexity} | ${fmtDelta(current.plugins.complexity - baseline.plugins.complexity)} (基线 ${baseline.plugins.complexity}) |`,
  `| **CLI 合计** | **${current.cliTotal.files}** (${fmtDelta(delta.files)}) | **${current.cliTotal.totalLines}** (${fmtDelta(delta.totalLines)}) | **${current.cliTotal.codeLines}** (${fmtDelta(delta.codeLines)}) | **${current.cliTotal.complexity}** | **${fmtDelta(delta.complexity)}** (基线 ${baseline.cliTotal.complexity}) |`,
  '',
  '## 2. VSCode 扩展独立统计（不计入 CLI 重构增量）',
  '',
  '| 模块 | 文件数 | 总行数 | 有效代码行 | 圈复杂度总和 |',
  '|---|---:|---:|---:|---:|',
  `| \`vscode-svg-extension/src/\` | ${current.vscode.files} | ${current.vscode.totalLines} | ${current.vscode.codeLines} | ${current.vscode.complexity} |`,
  '',
  '## 3. 文件清单与职责明细',
  '',
  '| 类别 | 文件路径 | 总行数 | 有效行 | 圈复杂度 | 职责说明 |',
  '|---|---|---:|---:|---:|---|',
  ...current.entries.map(
    (e) => `| ${e.category} | \`${e.file}\` | ${e.totalLines} | ${e.codeLines} | ${e.complexity} | ${describeRole(e.file)} |`,
  ),
  '',
].join('\n');

const outDir = join(ROOT, 'docs', 'metrics');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'metrics.md'), md, 'utf8');
writeFileSync(join(outDir, 'metrics.json'), JSON.stringify({ baseline, current, delta }, null, 2) + '\n', 'utf8');
console.log(`Metrics generated: CLI files=${current.cliTotal.files} (delta ${fmtDelta(delta.files)}), complexity=${current.cliTotal.complexity} (delta ${fmtDelta(delta.complexity)}), vscode files=${current.vscode.files}`);
