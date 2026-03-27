## Context

skills 不只是“仓库里的 Markdown 资产”，而是要被用户安装到自己的 AI 工作环境中，并被 Agent 稳定消费的能力包。

当前实现目标已经调整为：

- 仓库级 `skills/` 目录与模板，服务作者侧
- 用户级安装目录与 lockfile，服务分发侧
- Agent adapter，服务消费侧

核心原则是把“源文件目录”和“用户实际使用目录”彻底分开，避免 skill 依赖某个项目常驻。

## Goals / Non-Goals

**Goals:**

- 保留作者侧最小闭环：创建、列举、校验
- 建立用户侧最小闭环：安装、链接、卸载、检查
- 明确区分 workspace skill 与 user-installed skill
- 让 skill 的主消费路径不依赖 MCP server 常驻
- 为后续支持多个 Agent 预留 adapter 扩展点

**Non-Goals:**

- 当前变更不实现远程 registry 市场或在线发布平台
- 当前变更不要求一次支持所有 AI 客户端，先支持 Codex 并抽象 adapter
- 当前变更不保留 MCP 作为主能力；如需恢复，后续单独提变更
- 当前变更不做复杂语义路由或自动 skill 推荐引擎

## Product Direction

新的 skills 体系分成两层：

### 1. Authoring Plane

面向 skill 作者和仓库维护者：

- `hs-cli skills new`
- `hs-cli skills lint`
- `hs-cli skills list`

这一层负责“生产 skill 内容”。

### 2. Distribution Plane

面向最终用户：

- `hs-cli skills install`
- `hs-cli skills remove`
- `hs-cli skills link`
- `hs-cli skills doctor`

这一层负责“把 skill 放进用户 AI 环境并确认可用”。

## Decisions

**保留仓库根目录 `skills/` 作为作者侧资产目录**

仓库中的 `skills/` 仍然有价值，它适合：

- 管理官方/内置 skill
- 提供模板
- 进行 lint 与协作评审

但它不再等同于用户最终消费目录。

**新增统一的用户 skill 安装目录**

安装后的 skill 应位于用户目录，而不是依赖当前仓库路径。建议使用：

- `~/.hs-cli/skills/installed/<skill-id>`

Windows 对应路径位于：

- `%USERPROFILE%\\.hs-cli\\skills\\installed\\<skill-id>`

该目录用于存放用户真正已安装、可分发给 Agent 的 skill 副本或规范化内容。

**为安装状态引入 lockfile**

每个已安装 skill 需要记录：

- skill id
- version
- source type（workspace/local/git/official）
- source path 或来源标识
- installedAt
- linked agents

建议使用：

- `~/.hs-cli/skills/installed/<skill-id>/.skill-lock.json`

这使后续 update、doctor、remove 具备可追踪状态。

**引入 Agent adapter，而不是先做 MCP adapter**

主路径应该是把已安装 skill 链接到 Agent 能直接消费的位置。当前优先做 Codex adapter，并预留：

- `codex`
- `claude`
- `cursor`

等 adapter 接口。

接口职责：

- 计算 Agent 的 skills 目录
- 创建 link/copy
- 执行基础可用性检查

当前 Codex adapter 的默认目录为：

- macOS / Linux: `~/.codex/skills/<skill-id>`
- Windows: `%USERPROFILE%\\.codex\\skills\\<skill-id>`

**MCP 从当前变更中移出**

原因：

- 当前没有服务端部署场景
- 也没有证据表明用户会把“搜索 skill 的 MCP tools”作为日常主路径
- MCP 会扩大维护面，但不能直接解决 skill 发现与消费问题

因此当前变更先聚焦安装/链接路径。MCP 如确有需求，再以独立 change 重新评估。

## Command Strategy

建议命令面重构为：

```bash
hs-cli skills new <name>
hs-cli skills lint [name]
hs-cli skills list

hs-cli skills install <source>
hs-cli skills remove <name>
hs-cli skills link <name> --agent codex
hs-cli skills doctor
```

### `skills install <source>`

职责：

- 从 workspace 路径、本地目录或后续官方源安装 skill
- 复制或规范化写入用户安装目录
- 写入 lockfile

### `skills link <name> --agent codex`

职责：

- 根据 agent adapter 找到目标目录
- 为指定 skill 创建 symlink 或复制
- 更新 lockfile 中的 linked agents

### `skills remove <name>`

职责：

- 移除安装目录
- 清理已建立的 agent link
- 删除或更新 lockfile

### `skills doctor`

职责：

- 检查用户安装目录是否正常
- 检查 Agent 目录是否存在且可写
- 检查 link 是否失效
- 给出明确修复建议

## Data Model

### Workspace Skill

仓库中的原始 skill 内容，适合开发和维护。

### Installed Skill

用户目录中的标准化 skill，适合被 Agent 消费。

### Linked Skill

Installed skill 在具体 Agent 目录中的 link/copy 映射。

关系如下：

```text
workspace skill
project/skills/<skill-id>
    |
    v
install
    |
    v
installed skill (~/.hs-cli/skills/installed)
    |
    v
link
    |
    +--> codex adapter target (~/.codex/skills/<skill-id>)
    +--> future claude adapter target
    +--> future cursor adapter target
```

## Risks / Trade-offs

- [风险] 不同 Agent 的原生目录和消费方式可能变化
  - 通过 adapter 层隔离具体路径和 link 策略

- [风险] 当前移除 MCP 后，会失去一条“通用工具接入”路径
  - 但可换来更聚焦的主路径，避免继续分散实现精力

- [取舍] 先支持 Codex，暂不一次覆盖所有 Agent
  - 先验证安装与链接模型是否成立，再横向扩展

- [取舍] 保留 `skills/` 作者侧目录，但不继续强化多来源聚合能力
  - 避免把“内容浏览”误当成“用户使用”
