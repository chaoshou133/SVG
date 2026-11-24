# SVG Badge & Outline (VSCode Extension)

## 功能
1. **SVG 文件标记 (`[]`)**：在 Explorer 中为 `.svg` 普通文件附加 `[]` 徽标（不修改文件名或内容；非 SVG 文件与目录不加标记）。
2. **SVG 原生大纲 (Outline)**：在 VSCode 原生 Outline 视图展示嵌套层级（有 `id` 显示 `标签名#id`，无 `id` 显示 `标签名`），支持点击跳转源码、编辑实时更新，并在 XML 不完整时安全清空大纲而不崩溃。

## 安装、编译与启动步骤

```bash
cd vscode-svg-extension
npm install
npm run compile
npm test
```

在 VSCode 中启动调试（Extension Development Host）：
1. 用 VSCode 打开 `vscode-svg-extension/` 目录；
2. 按 `F5`（已配置 `.vscode/launch.json`），将自动打开 `fixtures/` 目录的新宿主窗口；
3. 在 Explorer 中观察 `example.svg` 右侧显示 `[]`，`plain.txt` 无标记；
4. 点击打开 `example.svg`，展开左下角 **Outline（大纲）** 视图，点击 `rect#start` 验证跳转到第 3 行源码；编辑文本验证实时刷新，打开 `broken.svg` 验证不崩溃。
