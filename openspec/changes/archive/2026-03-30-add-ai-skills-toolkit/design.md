## Context

skills 不只是"仓库里的 Markdown 资产"，而是要被用户安装到自己的 AI 工作环境中，并被 Agent 稳定消费的能力包。

当前实现目标调整为：

- 仓库级 `skills/` 目录与模板，服务**作者侧**
- 安装与分发委托给开源工具 `npx skills`（vercel-labs/agent-skills）
- hs-cli 只负责 skill 内容的创建与质量把关

核心原则：不重复造轮子，聚焦 hs-cli 的差异化价值。

## Goals / Non-Goals

**Goals:**

- 作者侧最小闭环：创建（`new`）、校验（`lint`）、查看（`list`）
- SKILL.md 格式对齐 [agentskills.io](https://agentskills.io) 开放规范
- `lint` 提供比 `npx skills init` 更严格的描述质量校验

**Non-Goals:**

- hs-cli 不实现 skill 安装、分发、link、update、remove——这些由 `npx skills` 负责
- hs-cli 不维护 agent adapter（Claude/Codex/Cursor 路径），随 `npx skills` 生态迭代
- hs-cli 不实现远程 registry 或在线发布平台
- hs-cli 不做 MCP adapter

## Product Direction

### 分工

```
hs-cli skills new / lint / list
    → 负责生产高质量 skill 内容（作者侧）

npx skills add / remove / list / update / find
    → 负责把 skill 安装到各 AI 客户端（分发侧）
```

### 用户完整路径

```bash
# 1. 创建 skill
hs-cli skills new my-skill

# 2. 编辑 skills/my-skill/SKILL.md 和 metadata.yaml

# 3. 校验质量
hs-cli skills lint my-skill

# 4. 安装到 AI 客户端（通过 skills-site）
npx skills add https://your-domain.com --skill my-skill
```

## Decisions

**SKILL.md 格式对齐 agentskills.io 规范**

frontmatter 保留 Claude Code 兼容字段：

- `name`：唯一标识符
- `description`：触发条件描述，Claude 根据此字段决定何时调用
- `tools`：可选，声明需要的工具权限

metadata.yaml 保留作者侧元数据（version、owner、status、tags）供 lint 和 list 使用。

**`lint` 是 hs-cli 的核心差异化**

`npx skills init` 只生成空模板，不做质量把关。hs-cli `lint` 额外校验：

- description 长度和内容质量（是否包含触发场景词、动作词）
- 必要目录结构（examples/、tests/）
- 拒绝模板占位文案

**安装分发不自研**

`npx skills`（vercel-labs/agent-skills）已支持：

- 40+ 个 agent（Claude Code、Codex、Cursor、Copilot 等）
- 项目级（默认）和全局（`-g`）两种安装模式
- symlink 机制，一处维护多 agent 共享
- GitHub/GitLab/本地路径来源

自研等同于重复建设，且需要跟随各 agent 迭代维护 adapter，收益远低于成本。

## Data Model

### Workspace Skill

仓库中的原始 skill 内容，hs-cli 负责创建与校验。

```
skills/
  <skill-id>/
    SKILL.md          ← 面向 Agent 的指令文档（agentskills.io 格式）
    metadata.yaml     ← 作者侧元数据（version/owner/status/tags）
    examples/         ← 使用示例
    tests/            ← 测试场景
```

### Installed Skill（不在 hs-cli 范围内）

由 `npx skills` 管理，部署到各 agent 目录：

```
Claude Code 项目级:  .claude/skills/<skill-id>/
Claude Code 全局:    ~/.claude/skills/<skill-id>/
Codex:              ~/.codex/skills/<skill-id>/
```

## Risks / Trade-offs

- [取舍] 依赖外部工具 `npx skills`，若该项目停止维护需要重新评估
  - 但 vercel-labs 维护，背书强，且 agentskills.io 是开放规范
  - 即使工具变化，skill 内容（SKILL.md）本身仍有价值

- [取舍] hs-cli 不控制安装路径，无法做 doctor 检查
  - 用户可以用 `npx skills list` 查看状态
  - 这是合理的职责边界，不需要 hs-cli 重复实现
