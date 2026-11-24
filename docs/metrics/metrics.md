# 代码度量报告（自动从 Git 历史生成）

- **基线版本**：`final`（commit `1541d6f`）
- **当前版本**：`HEAD`（commit `06b8a5e`）
- **生成脚本**：`scripts/generate-metrics.mjs`（排除 `node_modules/`、`dist/`、测试与锁文件；VSCode 扩展单独列出不混入 CLI 重构增量）

## 1. CLI 架构三层拆分汇总（内核 / 装配处 / 插件）

| 分类 | 文件数 | 总行数 | 有效代码行 | 圈复杂度总和 | 相比 `final` 圈复杂度变化 |
|---|---:|---:|---:|---:|---:|
| **内核 (`src/kernel/`)** | 59 | 2516 | 1989 | 323 | +67 (基线 256) |
| **装配处 (`src/host/` + `src/main.ts`)** | 8 | 337 | 280 | 61 | +60 (基线 1) |
| **插件 (`plugins/`)** | 50 | 1488 | 1218 | 130 | +130 (基线 0) |
| **CLI 合计** | **117** (+45) | **4341** (+1691) | **3487** (+1373) | **514** | **+257** (基线 257) |

## 2. VSCode 扩展独立统计（不计入 CLI 重构增量）

| 模块 | 文件数 | 总行数 | 有效代码行 | 圈复杂度总和 |
|---|---:|---:|---:|---:|
| `vscode-svg-extension/src/` | 6 | 320 | 263 | 54 |

## 3. 文件清单与职责明细

| 类别 | 文件路径 | 总行数 | 有效行 | 圈复杂度 | 职责说明 |
|---|---|---:|---:|---:|---|
| plugins | `plugins/builtin-commands/AddToHandler.ts` | 16 | 14 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/BuiltinCommandsPlugin.ts` | 53 | 51 | 2 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/CanvasHandler.ts` | 22 | 20 | 2 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/CreateHandler.ts` | 23 | 21 | 3 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/DeleteHandler.ts` | 16 | 14 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/ExitHandler.ts` | 14 | 12 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/GroupHandler.ts` | 16 | 14 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/HelpHandler.ts` | 24 | 22 | 3 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/InitHandler.ts` | 21 | 19 | 3 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/MoveHandler.ts` | 17 | 15 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/ReadHandler.ts` | 19 | 16 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/RedoHandler.ts` | 15 | 13 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/SaveHandler.ts` | 22 | 20 | 4 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/ScaleHandler.ts` | 17 | 15 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/SetHandler.ts` | 16 | 14 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/ShowHandler.ts` | 17 | 15 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/TreeHandler.ts` | 18 | 16 | 2 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/UndoHandler.ts` | 15 | 13 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/UngroupHandler.ts` | 16 | 14 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/ZOrderHandler.ts` | 25 | 21 | 2 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-commands/index.ts` | 4 | 3 | 1 | 内置命令插件（20 条 Phase 1 基础命令） |
| plugins | `plugins/builtin-shapes/BuiltinShapesPlugin.ts` | 21 | 19 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/Circle.ts` | 49 | 40 | 2 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/CircleShapeProvider.ts` | 18 | 15 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/Ellipse.ts` | 55 | 45 | 2 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/EllipseShapeProvider.ts` | 18 | 15 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/Group.ts` | 100 | 74 | 3 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/GroupShapeProvider.ts` | 18 | 15 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/Line.ts` | 53 | 43 | 2 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/LineShapeProvider.ts` | 18 | 15 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/Rect.ts` | 55 | 45 | 2 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/RectShapeProvider.ts` | 18 | 15 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/Text.ts` | 88 | 71 | 4 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/TextShapeProvider.ts` | 18 | 15 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/builtin-shapes/index.ts` | 11 | 9 | 1 | 内置图形插件（6 种 Phase 1 基础图形） |
| plugins | `plugins/plugin-cmd-dir/DirCommand.ts` | 55 | 43 | 9 | 外部命令插件：dir 目录查看（经 DirectoryAccess 适配器） |
| plugins | `plugins/plugin-cmd-dir/DirPlugin.ts` | 11 | 9 | 1 | 外部命令插件：dir 目录查看（经 DirectoryAccess 适配器） |
| plugins | `plugins/plugin-cmd-dir/index.ts` | 5 | 4 | 1 | 外部命令插件：dir 目录查看（经 DirectoryAccess 适配器） |
| plugins | `plugins/plugin-cmd-stats/StatsCommand.ts` | 48 | 39 | 7 | 外部命令插件：stats 图形统计 |
| plugins | `plugins/plugin-cmd-stats/StatsPlugin.ts` | 11 | 9 | 1 | 外部命令插件：stats 图形统计 |
| plugins | `plugins/plugin-cmd-stats/index.ts` | 5 | 4 | 1 | 外部命令插件：stats 图形统计 |
| plugins | `plugins/plugin-shape-box/Box.ts` | 142 | 105 | 8 | 外部复合图形插件：box（Shape + Attribute + TreeDecorator） |
| plugins | `plugins/plugin-shape-box/BoxAttributeHandler.ts` | 36 | 28 | 4 | 外部复合图形插件：box（Shape + Attribute + TreeDecorator） |
| plugins | `plugins/plugin-shape-box/BoxPlugin.ts` | 16 | 14 | 3 | 外部复合图形插件：box（Shape + Attribute + TreeDecorator） |
| plugins | `plugins/plugin-shape-box/BoxShapeProvider.ts` | 79 | 62 | 9 | 外部复合图形插件：box（Shape + Attribute + TreeDecorator） |
| plugins | `plugins/plugin-shape-box/BoxTypeDecorator.ts` | 13 | 10 | 3 | 外部复合图形插件：box（Shape + Attribute + TreeDecorator） |
| plugins | `plugins/plugin-shape-box/index.ts` | 9 | 7 | 1 | 外部复合图形插件：box（Shape + Attribute + TreeDecorator） |
| plugins | `plugins/plugin-tree-star/ModifiedStarDecorator.ts` | 94 | 71 | 23 | 外部树标签插件：modified-star（脏状态星标） |
| plugins | `plugins/plugin-tree-star/ModifiedStarPlugin.ts` | 13 | 11 | 1 | 外部树标签插件：modified-star（脏状态星标） |
| plugins | `plugins/plugin-tree-star/index.ts` | 5 | 4 | 1 | 外部树标签插件：modified-star（脏状态星标） |
| host | `src/host/AppBootstrap.ts` | 49 | 41 | 6 | 宿主装配、适配器实现与配置加载器 |
| host | `src/host/BuiltinAssembly.ts` | 15 | 9 | 1 | 宿主装配、适配器实现与配置加载器 |
| host | `src/host/CodeAssembly.ts` | 23 | 16 | 1 | 宿主装配、适配器实现与配置加载器 |
| host | `src/host/NodeDirectoryAdapter.ts` | 36 | 29 | 4 | 宿主装配、适配器实现与配置加载器 |
| host | `src/host/NodeFileSystem.ts` | 22 | 19 | 1 | 宿主装配、适配器实现与配置加载器 |
| host | `src/host/NullDirectoryAdapter.ts` | 13 | 10 | 1 | 宿主装配、适配器实现与配置加载器 |
| host | `src/host/PluginLoader.ts` | 176 | 154 | 46 | 宿主装配、适配器实现与配置加载器 |
| kernel | `src/kernel/cli/BufferOutput.ts` | 22 | 16 | 1 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/ConsoleOutput.ts` | 16 | 12 | 1 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/Editor.ts` | 33 | 24 | 5 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/EditorSession.ts` | 123 | 101 | 7 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/Output.ts` | 6 | 5 | 1 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/Repl.ts` | 36 | 28 | 4 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/Token.ts` | 11 | 9 | 2 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/cli/Tokenizer.ts` | 43 | 37 | 13 | 内核会话、词法分析与 REPL 驱动 |
| kernel | `src/kernel/commands/AddToCommand.ts` | 45 | 39 | 3 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/CommandHistory.ts` | 61 | 50 | 6 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/CreateShapeCommand.ts` | 40 | 31 | 5 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/DeleteCommand.ts` | 33 | 28 | 1 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/GroupCommand.ts` | 79 | 68 | 12 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/MoveCommand.ts` | 31 | 26 | 1 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/Placement.ts` | 21 | 17 | 1 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/ScaleCommand.ts` | 35 | 30 | 2 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/SetAttributeCommand.ts` | 100 | 77 | 11 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/UndoableCommand.ts` | 8 | 4 | 1 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/UngroupCommand.ts` | 53 | 48 | 5 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/commands/ZOrderCommand.ts` | 32 | 24 | 2 | 内核可撤销编辑命令与历史栈 |
| kernel | `src/kernel/ext/AttributeContext.ts` | 11 | 6 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/AttributeHandler.ts` | 21 | 8 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/AttributeHandlerRegistry.ts` | 48 | 36 | 11 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/AttributeResult.ts` | 5 | 4 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/Command.ts` | 22 | 15 | 3 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/CommandRegistry.ts` | 34 | 24 | 3 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/DocumentEvent.ts` | 9 | 7 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/DocumentEventBus.ts` | 17 | 13 | 2 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/DocumentEventListener.ts` | 6 | 4 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/Plugin.ts` | 7 | 5 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/PluginContext.ts` | 20 | 14 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/PluginManager.ts` | 184 | 163 | 41 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/PluginManifest.ts` | 10 | 9 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/ShapeProvider.ts` | 34 | 16 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/ShapeRegistry.ts` | 67 | 53 | 12 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/TreeDecorator.ts` | 12 | 6 | 1 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/ext/TreeDecoratorRegistry.ts` | 35 | 26 | 5 | 内核扩展点接口 / 注册表 / 插件事务管理 |
| kernel | `src/kernel/io/DirectoryAccess.ts` | 11 | 5 | 1 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/DirectoryEntry.ts` | 7 | 6 | 1 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/FileSystem.ts` | 8 | 4 | 1 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/IdAllocator.ts` | 20 | 17 | 4 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/SvgReader.ts` | 161 | 141 | 33 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/SvgWriter.ts` | 52 | 46 | 1 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/XmlElement.ts` | 18 | 12 | 1 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/XmlParser.ts` | 202 | 177 | 44 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/io/XmlText.ts` | 8 | 6 | 1 | 内核 IO 端口、XML 解析与 SVG 读写 |
| kernel | `src/kernel/model/ChildList.ts` | 37 | 30 | 3 | 内核领域模型抽象 |
| kernel | `src/kernel/model/CompositeMemento.ts` | 12 | 9 | 2 | 内核领域模型抽象 |
| kernel | `src/kernel/model/Container.ts` | 21 | 11 | 1 | 内核领域模型抽象 |
| kernel | `src/kernel/model/EditorError.ts` | 7 | 6 | 1 | 内核领域模型抽象 |
| kernel | `src/kernel/model/GeometricShape.ts` | 104 | 84 | 8 | 内核领域模型抽象 |
| kernel | `src/kernel/model/GeometryMemento.ts` | 20 | 16 | 2 | 内核领域模型抽象 |
| kernel | `src/kernel/model/Num.ts` | 33 | 25 | 8 | 内核领域模型抽象 |
| kernel | `src/kernel/model/Shape.ts` | 192 | 132 | 15 | 内核领域模型抽象 |
| kernel | `src/kernel/model/ShapeMemento.ts` | 4 | 3 | 1 | 内核领域模型抽象 |
| kernel | `src/kernel/model/ShapeStateSnapshot.ts` | 8 | 3 | 1 | 内核领域模型抽象 |
| kernel | `src/kernel/model/SvgDocument.ts` | 131 | 100 | 8 | 内核领域模型抽象 |
| kernel | `src/kernel/view/ShowRenderer.ts` | 26 | 23 | 5 | 内核视图渲染器（tree / show） |
| kernel | `src/kernel/view/TreeRenderer.ts` | 64 | 50 | 10 | 内核视图渲染器（tree / show） |
| host | `src/main.ts` | 3 | 2 | 1 | 宿主装配、适配器实现与配置加载器 |
| vscode | `vscode-svg-extension/src/SvgBadgeRule.ts` | 19 | 13 | 3 | VSCode 扩展：文件 [] 标记与原生 SVG 大纲 |
| vscode | `vscode-svg-extension/src/SvgDocumentSymbolProvider.ts` | 32 | 24 | 3 | VSCode 扩展：文件 [] 标记与原生 SVG 大纲 |
| vscode | `vscode-svg-extension/src/SvgFileDecorationProvider.ts` | 28 | 22 | 3 | VSCode 扩展：文件 [] 标记与原生 SVG 大纲 |
| vscode | `vscode-svg-extension/src/SvgOutlineNode.ts` | 20 | 14 | 3 | VSCode 扩展：文件 [] 标记与原生 SVG 大纲 |
| vscode | `vscode-svg-extension/src/SvgOutlineParser.ts` | 204 | 177 | 41 | VSCode 扩展：文件 [] 标记与原生 SVG 大纲 |
| vscode | `vscode-svg-extension/src/extension.ts` | 17 | 13 | 1 | VSCode 扩展：文件 [] 标记与原生 SVG 大纲 |
