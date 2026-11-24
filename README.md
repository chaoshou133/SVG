# svg-editor

CLI SVG editor & VSCode extension — PJ1 Phase 1 & Phase 2. TypeScript, object-oriented, plugin architecture, zero runtime dependencies.

```bash
npm install
npm run cli                                                   # Mode A (code assembly), prompt: svg>
node dist/src/main.js --config plugins.config.json            # Mode B (config assembly)
node dist/src/main.js --no-plugins < doc/transcript/cli-1.txt # Phase 1 baseline mode
npm test                                                      # all automated tests (CLI + plugins)
npm --prefix vscode-svg-extension test                        # VSCode extension unit tests
node scripts/generate-metrics.mjs                             # regenerate docs/metrics/
```

Project documentation (VSCode extension, extension points, PlantUML architecture, ADRs, metrics): [doc/README.md](doc/README.md).
Metrics report: [docs/metrics/metrics.md](docs/metrics/metrics.md).
