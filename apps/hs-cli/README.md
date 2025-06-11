# create-hs-cli

基于 Commander.js 构建的现代化 Node.js 项目脚手架工具，支持多种项目模板。

## 特性

- 🚀 快速创建项目，支持Vue3和Nuxt3模板
- 🛠️ 交互式命令行界面，简单易用
- 📦 自动处理项目依赖和配置
- 🔧 可扩展的命令系统

## 安装

```bash
# 全局安装
npm install -g create-hs-cli

# 或者直接使用npx
npx create-hs-cli
```

## 使用方法

### 创建新项目

```bash
# 使用交互式界面创建项目
npm create hs-cli

# 或者使用npx
npx create-hs-cli
```

执行命令后，会出现交互式提示：
1. 选择项目模板（Vue3或Nuxt3）
2. 输入项目名称
3. 自动创建项目结构

### 可用命令

- `create`: 创建一个新项目
- `generate`: 生成组件、页面、服务或Hook
- `init`: 在当前目录初始化配置

```bash
# 生成一个组件
npx create-hs-cli generate component Button

# 在当前目录初始化配置
npx create-hs-cli init
```

## 项目模板

目前支持以下项目模板：

### Vue3模板

- 基于Vue 3和Vite构建
- TypeScript支持
- Pinia状态管理
- Vue Router
- UnoCSS原子化CSS
- 自动导入组件和API
- 完整的项目结构

### Nuxt3模板

- 基于Nuxt 3框架
- TypeScript支持
- 服务端渲染(SSR)
- API自动导入
- UnoCSS支持
- 完整的项目结构和API示例

## 本地开发

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 开发模式运行
pnpm dev

# 或者使用特定命令
pnpm cli:create
pnpm cli:generate component Button
pnpm cli:init
```

### 本地链接测试

```bash
# 构建项目
pnpm build

# 链接到全局
npm link

# 现在你可以在任何地方使用
create-hs-cli
```

## 许可证

MIT 