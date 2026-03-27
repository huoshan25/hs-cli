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

`skills/` 目录是作者侧源目录，不是 Agent 直接消费目录。当前推荐路径是：

```text
workspace skill
your-project/skills/my-skill

    add / install

installed skill
~/.hs-cli/skills/installed/my-skill

    link

codex skill
~/.codex/skills/my-skill
```

最短使用路径：

```bash
# 用户侧：查看 CLI 自带的官方 skills
hs-cli skills list --scope official

# 安装官方 skill，默认链接到 Codex
hs-cli skills add code-review-guardian

# 安装本地第三方 skill
hs-cli skills add ./path/to/other-skill

# 安装第三方 git skill
hs-cli skills add git+https://example.com/your-skill.git

# 查看安装和链接状态
hs-cli skills list --scope installed
hs-cli skills doctor
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

# 列出 CLI 自带的官方 skills
hs-cli skills list --scope official

# 列出当前已安装 skills
hs-cli skills list --scope installed

# 校验所有 skills 结构
hs-cli skills lint

# 仅校验指定 skill
hs-cli skills lint copywriter

# 用户侧主命令：安装官方 skill 并默认链接到 Codex
hs-cli skills add code-review-guardian

# 安装本地第三方 skill
hs-cli skills add ./path/to/other-skill

# 安装第三方 git skill
hs-cli skills add git+https://example.com/your-skill.git

# 从当前工作区安装 skill 并默认链接到 Codex
hs-cli skills add copywriter

# 在项目根目录安装当前工作区 skill
hs-cli skills add ./skills/copywriter

# 在项目任意子目录里，直接按 skill 名称安装当前工作区 skills 下的目录
hs-cli skills add copywriter

# 只安装，不自动链接
hs-cli skills add copywriter --no-link

# 链接到 Codex
hs-cli skills link copywriter --agent codex

# 检查已安装 skill 与 link 状态
hs-cli skills doctor

# 移除已安装 skill
hs-cli skills remove copywriter

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

- `new <name>`: 使用 `skills/templates/skill-template` 创建 skill 目录
- `list [--scope workspace|official|installed]`: 列出当前工作区中的 skills、CLI 自带的官方 skills，或已安装的 skills
- `add <source>`: 用户侧主命令。支持安装官方 skill、当前工作区 skill、本地目录 skill 或 git 仓库 skill，并默认自动链接到 Codex
- `lint [name]`: 校验单个或全部 workspace skill 的目录结构与 `description` 质量（长度、动作词、场景词、泛化词）
- `install <source>`: 与 `add` 等价，保留为显式安装命令
- `remove <name>`: 删除已安装 skill，并清理相关 agent link
- `link <name> --agent codex`: 将已安装 skill 链接到 Codex 的 skills 目录
- `doctor`: 检查已安装 skill、用户安装目录以及 agent link 状态

默认安装目录为 `~/.hs-cli/skills/installed`，可通过 `HS_CLI_INSTALLED_SKILLS_DIR` 覆盖。

Codex 默认链接目录为 `~/.codex/skills`，可通过 `HS_CLI_CODEX_SKILLS_DIR` 或 `CODEX_HOME` 覆盖。

### Skills 目录模型

skills 当前分成三层目录，不要混用：

1. 来源目录

- 这是项目仓库里的作者侧目录，例如 `your-project/skills/my-skill`
- 用于编写、评审和版本管理

2. 安装目录

- 这是用户机器上的全局目录
- macOS / Linux 默认路径：`~/.hs-cli/skills/installed/<skill-id>`
- Windows 默认路径：`%USERPROFILE%\\.hs-cli\\skills\\installed\\<skill-id>`
- `hs-cli skills add <source>` 会把来源目录复制到这里

3. Agent 消费目录

- 这是 AI 客户端真正读取的目录
- Codex 默认路径：
- macOS / Linux：`~/.codex/skills/<skill-id>`
- Windows：`%USERPROFILE%\\.codex\\skills\\<skill-id>`
- `hs-cli skills add <source>` 默认会自动链接到这里
- 也可以手动执行 `hs-cli skills link <name> --agent codex`

关系如下：

```text
项目里的源 skill
your-project/skills/my-skill

    install

用户全局安装目录
~/.hs-cli/skills/installed/my-skill

    link

Codex 读取目录
~/.codex/skills/my-skill
```

这意味着：

- skill 可以来自 CLI 自带官方目录、当前项目、本地其他目录或 git 仓库
- 安装后不再依赖原项目目录持续存在
- 同一个用户可以从多个项目安装不同 skills
- CLI 的主路径是“全局安装 + 链接到 agent”，不是在单个项目目录里直接运行

安装命令的路径解析规则：

- 传官方 skill 名称时，优先从 CLI 自带官方 skills 中安装
- 传 `git+https://...`、`https://...git` 或 `git@...` 时，会先临时克隆仓库，再从其中解析 skill 目录
- 传绝对路径时，按绝对路径安装
- 传相对路径时，优先按当前 shell 的 `cwd` 解析
- 如果当前在项目子目录中，建议直接传 skill 名称，例如 `hs-cli skills add my-skill`
- `hs-cli` 会自动定位最近的 workspace `skills/` 目录，并在其中查找同名 skill
- 如果本地和官方存在同名 skill，当前实现会优先采用本地目录解析，再回退到官方内置 skills

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
