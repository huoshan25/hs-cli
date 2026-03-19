# @huo-shan/cli

一个持续进化的 CLI 工具集，目前支持项目创建、代码生成和配置初始化，后续将持续扩展更多能力。

## 特性

- 🚀 快速创建项目，支持 Vue3 和 Nuxt3 模板
- 🛠️ 交互式命令行界面，简单易用
- 🔧 代码生成，支持组件、页面、服务、Hook
- ✨ 支持模板特性选择，按需生成项目

## 安装

```bash
# 全局安装
npm install -g @huo-shan/cli

# 或者直接使用 npx
npx @huo-shan/cli
```

## 使用方法

### 创建新项目

```bash
npx hs-cli create
```

执行命令后，会出现交互式提示：
1. 选择项目模板（Vue3 或 Nuxt3）
2. 选择项目特性（TypeScript、Router、Pinia 等）
3. 输入项目名称
4. 自动创建项目结构

### 可用命令

```bash
# 创建一个新项目
hs-cli create

# 生成代码文件（component / page / service / hook）
hs-cli generate <type> <name>
hs-cli g component Button
hs-cli g page Home
hs-cli g service User
hs-cli g hook useAuth

# 在当前目录初始化配置文件
hs-cli init

# 查看帮助
hs-cli --help
```

## 项目模板

### Vue3 模板

基于 Vue 3 + Vite，可选特性：

- TypeScript
- JSX 支持
- Vue Router
- Pinia
- UnoCSS
- Vitest
- Auto Import
- 组件自动注册

### Nuxt3 模板

基于 Nuxt 3，可选特性：

- TypeScript
- UnoCSS
- Sass
- VueUse
- Nuxt Image
- Auto Import
- 组件自动注册

## 本地开发

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建
pnpm build

# 链接到全局测试
npm link
```

## 许可证

MIT
