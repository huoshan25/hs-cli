# hs-cli

现代化的前端开发 CLI 工具集，采用 monorepo 架构管理，支持快速创建项目、生成代码文件、初始化配置及 AI skills 管理。

## 项目概述

本仓库是一个 monorepo 项目，包含前端开发 CLI 工具及其相关依赖包。主要产品是 `hs-cli`，支持创建 Vue3、Nuxt3 项目模板，以及代码生成等功能。

### 主要特性

- 🚀 monorepo 架构，统一管理多个相关包
- 🛠️ 现代化 CLI 工具，支持创建 Vue3 和 Nuxt3 项目
- 📦 共享工具包，提高代码复用性
- 🔧 统一的开发、构建和发布流程
- 🖥️ 支持 OpenSpec 命令行/TUI/Web 可视化面板
- 🤖 提供仓库级 `packages/skills/` 作者侧目录与 `hs-cli skills` 管理命令
- 🔗 安装分发委托给 `npx skills`，hs-cli 专注作者侧内容质量

## 仓库结构

```
.
├── apps                       # 应用程序
│   ├── cli                    # CLI 工具入口
│   │   ├── bin                # 可执行文件
│   │   ├── dist               # 构建输出目录
│   │   └── src                # 源代码
│   │       ├── commands       # 命令实现
│   │       │   ├── create/    # create 命令（含模板和处理器）
│   │       │   ├── generate.ts
│   │       │   ├── init.ts
│   │       │   └── openspec.ts
│   ├── hs-console             # Console Web 面板
│   └── skills-site            # Skills 对外展示站点（Well-Known 协议）
├── packages                   # 共享包
│   ├── skills                 # AI skills 内容资产目录
│   │   ├── registry           # skills 注册表
│   │   └── templates          # skills 模板目录
│   └── utils                  # 共享工具函数包
```

## 包说明

### @huo-shan/cli

主要的 CLI 工具，支持项目创建、代码生成、配置初始化、Console 可视化面板（`hs-cli console`）以及 skills 管理（`hs-cli skills`）。

hs-cli 负责作者侧闭环，安装分发委托给 `npx skills`：

- `hs-cli skills new <name>` — 基于模板创建 skill 目录
- `hs-cli skills lint [name]` — 结构与质量校验

完整工作流：

```bash
# 1. 创建 skill
hs-cli skills new my-skill

# 2. 编辑 packages/skills/my-skill/SKILL.md 和 metadata.yaml

# 3. 校验质量
hs-cli skills lint my-skill

# 4. 安装到 AI 客户端（通过 skills-site 或直接路径）
npx skills add https://your-domain.com --skill my-skill
```

skill 的安装、卸载、agent link、环境检查等由 [`npx skills`](https://github.com/vercel-labs/agent-skills) 负责，hs-cli 不重复实现。

> **注意**: 关于 CLI 工具的详细使用方法，请查看 [CLI 工具的 README 文档](./apps/cli/README.md)

### skills-site

对外的 skill 展示站点，基于 Well-Known 协议对外暴露 skill 信息，支持通过 `npx skills add` 安装。

```bash
# 用户安装单个 skill
npx skills add https://your-domain.com --skill spec-proposal-writer

# 本地开发
cd apps/skills-site
pnpm dev
```

### utils

提供共享的工具函数，被其他包引用。

## 开发指南

### 环境准备

- Node.js 16+
- pnpm 7+

### 安装依赖

```bash
pnpm install
```

### 开发工作流

```bash
# 开发模式运行 CLI
cd apps/cli
pnpm dev

# 构建所有包
pnpm build:all
```

### 本地测试

```bash
# 进入 CLI 目录
cd apps/cli

# 构建项目
pnpm build

# 链接到全局
npm link

# 现在你可以在任何地方使用
hs-cli
```

## 发布流程

```bash
# 发布所有包
pnpm publish:all

# 或单独发布
pnpm publish:utils  # 发布工具包
pnpm publish:cli    # 发布 CLI 包
```

## 许可证

MIT
