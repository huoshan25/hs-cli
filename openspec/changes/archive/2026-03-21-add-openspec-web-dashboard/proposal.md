## Why

当前 `openspec` 命令主要是命令行/TUI 体验，复杂项目在信息密度、跨变更浏览、全局检索和多文件阅读上效率有限。需要一个长期可扩展的 Web 面板形态来支撑后续能力扩展。

## What Changes

- 为 `hs-cli openspec` 增加 Web UI 能力（`--ui web`）
- 提供 Web 面板信息架构：概览、提案、变更、归档
- 提供 Markdown/代码高亮/Mermaid 渲染与原文切换
- 提供变更动作执行（严格验证、确认归档）及结果反馈
- 提供项目中心（Project Hub）与全局搜索（Palette）并支持键盘导航
- 支持主题切换与核心快捷键操作

## Capabilities

### New Capabilities

- `openspec-web-dashboard`：OpenSpec Web 面板能力

### Modified Capabilities

- `openspec` 命令：新增 `--ui web` 使用路径

## Impact

- `apps/openspec-web/` 新增并作为 Web 面板前端实现
- `apps/cli` 增加 Web 静态资源集成与分发能力
- `openspec` 命令在 Web 模式下可执行项目浏览与变更动作
