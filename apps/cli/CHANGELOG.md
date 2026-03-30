# Changelog

## [0.3.0] - 2026-03-30

### 新增

- 新增 `apps/skills-site` 静态站点，基于 Vite + React + Tailwind CSS
  - 实现 Well-Known 协议（`/.well-known/agent-skills/index.json`），支持 `npx skills add https://your-domain.com --skill <name>` 安装
  - skill 列表页（搜索过滤）+ 详情页（含一键复制安装命令）
  - 构建脚本自动从 `packages/skills/` 读取内容生成静态数据
- Console 面板 Skills 模块新增已安装 skill 展示
  - 读取 `.agents/skills/`（项目级）和 `~/.agents/skills/`（全局）目录
  - 读取 `skills-lock.json` 和 `~/.agents/.skill-lock.json` 展示安装来源与时间
  - 展示各 agent 链接状态（valid / broken）

### 重构

- Skills 安装分发体系重构：废弃 hs-cli 自研的 `add/remove/link/doctor` 命令，改为委托给 `npx skills`（vercel-labs/agent-skills）
- `skills/` 目录从仓库根目录迁移至 `packages/skills/`，纳入 monorepo 统一管理
- `hs-cli skills new` 改为动态查找 workspace skills 根目录，不再硬编码路径
- 删除 `copy-skills-official` 构建脚本，CLI 包不再内置 skill 文件

### 修复

- 修复 `skills new` 创建后提示的安装命令路径错误问题

### 文档

- 新增 `docs/npx-skills-research.md`：npx skills 工具安装来源格式与最佳实践研究报告
- 更新根目录 `README.md` 仓库结构图，补充 `apps/skills-site` 和 `packages/skills` 说明
- 更新 `apps/cli/README.md` Skills 使用模型，对齐新的分工设计

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
