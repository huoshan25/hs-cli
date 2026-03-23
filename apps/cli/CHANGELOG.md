# Changelog

## [0.2.0] - 2026-03-21

### 新增

- `openspec` 命令支持 Web 面板（`hs-cli openspec --ui web`），并可在 `auto` 模式下自动选择 UI
- 新增 OpenSpec Web 面板能力：概览/提案/变更/归档四标签联动视图
- 新增 Project Hub（项目切换）与 Palette（全局搜索）交互
- 新增变更动作执行能力：严格验证、确认归档与输出日志反馈

### 体验优化

- Web 面板支持 Markdown/代码高亮/Mermaid 渲染与原文切换
- 支持主题切换与快捷键导航（`1/2/3/4`、`j/k`、`f`、`p`、`o`、`Cmd/Ctrl+K` 等）
- 对齐并优化 Web 面板样式与键盘交互细节（列表、过滤、项目中心、弹层）

## [0.1.0] - 2026-03-18

### 重构

- 包名从 `create-hs-cli` 改为 `@huo-shan/cli`，bin 命令保持 `hs-cli` 不变
- 目录从 `apps/hs-cli/` 重命名为 `apps/cli/`
- 移除 `standard-version`，改为手动管理版本和 CHANGELOG
- CLI 描述更新，去掉"脚手架"定位，改为通用前端开发 CLI 工具
- `create` 命令相关资源（`templates/`、`templates-handler/`）从 `src/` 顶层移入 `src/commands/create/` 下，命令代码聚合管理
- `create.ts` 改为 `create/index.ts`，外部导入路径不变

### 功能

- `create`：交互式创建 Vue3 / Nuxt3 项目，支持特性选择
- `generate`：生成 component、page、service、hook 代码文件
- `init`：在当前目录初始化 `hs-cli.config.js` 配置文件
