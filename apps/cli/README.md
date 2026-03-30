# @huo-shan/cli

一个持续进化的 CLI 工具集，目前支持项目创建、代码生成、配置初始化、Console 可视化面板与 AI skills 管理。

## 特性

- 🚀 快速创建项目，支持 Vue3 和 Nuxt3 模板
- 🛠️ 交互式命令行界面，简单易用
- 🔧 代码生成，支持组件、页面、服务、Hook
- ✨ 支持模板特性选择，按需生成项目
- 🖥️ Console 面板，支持命令行/TUI 与 Web 两种模式
- ⌨️ Console Web 面板支持项目中心、全局搜索与快捷键操作
- 🤖 提供 `skills` 命令组，支持 skill 创建、列举和结构校验

## Skills 使用模型

`packages/skills/` 是作者侧源目录，负责 skill 内容的创建与质量把关。安装分发通过 `apps/skills-site` 站点的 Well-Known 协议对外提供。

完整工作流：

```bash
# 1. 创建 skill
hs-cli skills new my-skill

# 2. 编辑 packages/skills/my-skill/SKILL.md 和 metadata.yaml

# 3. 校验质量
hs-cli skills lint my-skill

# 4. 安装到 AI 客户端（通过 skills-site）
npx skills add https://your-domain.com --skill my-skill
```

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

# 启动 Console 面板（默认 auto）
hs-cli console

# 直达 OpenSpec 模块
hs-cli console openspec --ui web

# 直达 Skills 模块
hs-cli console skills

# 在任意目录指定 skills 路径
hs-cli console skills --skills-dir /path/to/repo/skills

# 强制使用 Web 面板
hs-cli console --ui web

# 强制使用命令行面板
hs-cli console --ui tui

# 指定文档路径和主题
hs-cli console --doc ./openspec/project.md --theme light

# 基于模板创建 skill
hs-cli skills new copywriter

# 列出当前工作区内 skills
hs-cli skills list

# 校验所有 skills 结构
hs-cli skills lint

# 仅校验指定 skill
hs-cli skills lint copywriter

# 安装到 AI 客户端（通过 skills-site）
npx skills add https://your-domain.com --skill copywriter

# 查看帮助
hs-cli --help
```

### Console 命令参数

```bash
hs-cli console [options]
```

- `-d, --doc <path>`: 指定 OpenSpec 文档路径
- `-s, --skills-dir <path>`: 指定 skills 目录路径（默认从当前目录向上自动查找）
- `-t, --theme <theme>`: 主题，`dark|light`，默认 `dark`
- `-u, --ui <mode>`: 面板模式，`auto|tui|web`，默认 `auto`
- `--no-watch`: 关闭 Web 热更新（默认开启）
- 子命令：`openspec`（直达 OpenSpec 模块）、`skills`（直达 Skills 模块）

### Skills 命令参数

```bash
hs-cli skills <command>
```

- `new <name>`: 使用 `packages/skills/templates/skill-template` 创建 skill 目录
- `list`: 列出当前工作区中的 skills
- `lint [name]`: 校验单个或全部 workspace skill 的目录结构与 `description` 质量（长度、动作词、场景词、泛化词）

skill 的安装、卸载、agent link、环境检查由 [`npx skills`](https://github.com/vercel-labs/agent-skills) 负责，hs-cli 不重复实现。

### Skills 目录模型

```text
workspace skill（作者侧，hs-cli 负责）
your-project/packages/skills/my-skill

    npx skills add https://your-domain.com --skill my-skill

agent 消费目录（npx skills 负责）
.claude/skills/my-skill      ← 项目级
~/.claude/skills/my-skill    ← 全局
~/.codex/skills/my-skill
```

### Console Web 快捷键

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
