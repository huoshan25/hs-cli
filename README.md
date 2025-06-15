# hs-cli

现代化的前端项目脚手架工具集，采用monorepo架构管理，用于快速创建和初始化各类前端项目。

## 项目概述

本仓库是一个monorepo项目，包含了用于快速创建前端项目的脚手架工具及其相关依赖包。主要产品是`create-hs-cli`脚手架，支持创建多种项目模板。

### 主要特性

- 🚀 monorepo架构，统一管理多个相关包
- 🛠️ 现代化CLI工具，支持创建Vue3和Nuxt3项目
- 📦 共享工具包，提高代码复用性
- 🔧 统一的开发、构建和发布流程

## 仓库结构

```
.
├── apps                       # 应用程序
│   └── hs-cli                 # CLI 脚手架工具
│       ├── bin                # 可执行文件
│       ├── dist               # 构建输出目录
│       └── src                # 源代码
│           ├── commands       # 命令实现
│           ├── templates      # 项目模板
│           └── utils          # CLI工具特定工具函数
└── packages                   # 共享包
    └── utils                  # 共享工具函数包
```

## 包说明

### create-hs-cli

主要的CLI工具，用于快速创建和初始化前端项目。

> **注意**: 关于CLI工具的详细使用方法，请查看 [CLI工具的README文档](./apps/hs-cli/README.md)

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
# 开发模式运行CLI
cd apps/hs-cli
pnpm dev

# 构建所有包
pnpm build:all
```

### 本地测试

```bash
# 进入CLI目录
cd apps/hs-cli

# 构建项目
pnpm build

# 链接到全局
npm link

# 现在你可以在任何地方使用
create-hs-cli
```

## 发布流程

```bash
# 发布所有包
pnpm publish:all

# 或单独发布
pnpm publish:utils  # 发布工具包
pnpm publish:cli    # 发布CLI包
```

## 许可证

MIT 