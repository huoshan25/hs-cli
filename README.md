# hs-cli

现代化的前端开发 CLI 工具集，采用 monorepo 架构管理，支持快速创建项目、生成代码文件及初始化配置。

## 项目概述

本仓库是一个 monorepo 项目，包含前端开发 CLI 工具及其相关依赖包。主要产品是 `hs-cli`，支持创建 Vue3、Nuxt3 项目模板，以及代码生成等功能。

### 主要特性

- 🚀 monorepo 架构，统一管理多个相关包
- 🛠️ 现代化 CLI 工具，支持创建 Vue3 和 Nuxt3 项目
- 📦 共享工具包，提高代码复用性
- 🔧 统一的开发、构建和发布流程

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
│           │   └── init.ts
└── packages                   # 共享包
    └── utils                  # 共享工具函数包
```

## 包说明

### @huo-shan/cli

主要的 CLI 工具，支持项目创建、代码生成和配置初始化。

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