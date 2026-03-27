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
- 🤖 提供仓库级 `skills/` 作者侧目录与 `hs-cli skills` 管理命令
- 🔗 支持将 skill 安装到用户目录，并链接到 AI 客户端消费目录

## 仓库结构

```
.
├── apps                       # 应用程序
│   └── cli                    # CLI 工具入口
│       ├── bin                # 可执行文件
│       ├── dist               # 构建输出目录
│       └── src                # 源代码
│           ├── commands       # 命令实现
│           │   ├── create/    # create 命令（含模板和处理器）
│           │   ├── generate.ts
│           │   ├── init.ts
│           │   └── openspec.ts
│   └── hs-console             # Console Web 面板
├── skills                     # AI skills 资产目录
│   ├── registry               # skills 注册表
│   └── templates              # skills 模板目录
└── packages                   # 共享包
    └── utils                  # 共享工具函数包
```

## 包说明

### @huo-shan/cli

主要的 CLI 工具，支持项目创建、代码生成、配置初始化、Console 可视化面板（`hs-cli console`）以及 skills 管理（`hs-cli skills`）。

当前 skills 的使用模型是：

- 项目中的 `skills/` 目录只负责存放作者侧源文件
- CLI 发布包可携带官方内置 skills，用户安装后可直接查看和安装
- 用户通过 `hs-cli skills add` 或 `hs-cli skills install` 把 skill 安装到全局用户目录
- 用户再通过 `hs-cli skills link --agent codex` 把已安装 skill 链接到 Codex 的消费目录

最短使用路径：

```bash
# 用户侧：查看 CLI 自带的官方 skills
hs-cli skills list --scope official

# 安装官方 skill，默认会链接到 Codex
hs-cli skills add code-review-guardian

# 安装本地第三方 skill
hs-cli skills add ./path/to/other-skill

# 安装第三方 git skill
hs-cli skills add git+https://example.com/your-skill.git

# 查看已安装状态
hs-cli skills list --scope installed
hs-cli skills doctor
```

默认路径：

- 安装目录：`~/.hs-cli/skills/installed`
- Codex 目录：`~/.codex/skills`

Windows 下等价目录位于 `%USERPROFILE%` 下，对应：

- `%USERPROFILE%\\.hs-cli\\skills\\installed`
- `%USERPROFILE%\\.codex\\skills`

> **注意**: 关于 CLI 工具的详细使用方法，请查看 [CLI 工具的 README 文档](./apps/cli/README.md)

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
