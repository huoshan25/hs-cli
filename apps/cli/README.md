# @huo-shan/cli

一个持续进化的 CLI 工具集，目前支持项目创建、代码生成、配置初始化和 OpenSpec 可视化面板。

## 特性

- 🚀 快速创建项目，支持 Vue3 和 Nuxt3 模板
- 🛠️ 交互式命令行界面，简单易用
- 🔧 代码生成，支持组件、页面、服务、Hook
- ✨ 支持模板特性选择，按需生成项目
- 🖥️ OpenSpec 面板，支持命令行/TUI 与 Web 两种模式
- ⌨️ OpenSpec Web 面板支持项目中心、全局搜索与快捷键操作

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

# 启动 OpenSpec 面板（默认 auto）
hs-cli openspec

# 强制使用 Web 面板
hs-cli openspec --ui web

# 强制使用命令行面板
hs-cli openspec --ui tui

# 指定文档路径和主题
hs-cli openspec --doc ./openspec/project.md --theme light

# 查看帮助
hs-cli --help
```

### OpenSpec 命令参数

```bash
hs-cli openspec [options]
```

- `-d, --doc <path>`: 指定 OpenSpec 文档路径
- `-t, --theme <theme>`: 主题，`dark|light`，默认 `dark`
- `-u, --ui <mode>`: 面板模式，`auto|tui|web`，默认 `auto`
- `--no-watch`: 关闭 Web 热更新（默认开启）

### OpenSpec Web 快捷键

- `Cmd/Ctrl + K`: 打开全局搜索
- `/`: 聚焦左侧搜索框
- `1/2/3/4`: 切换 概览/提案/变更/归档
- `j/k` 或 `↑/↓`: 列表上下导航
- `f`: 循环切换筛选条件（提案/变更页）
- `p`: 打开项目中心
- `o`: 打开动作中心（变更页）

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
