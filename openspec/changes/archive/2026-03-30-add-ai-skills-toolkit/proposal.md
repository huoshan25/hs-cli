## Why

当前方案已经具备本地 `skills/` 目录、模板、lint、多来源聚合与 MCP tools，但产品主线偏向“资产管理”和“供 AI 读取的数据接口”。

这没有解决真正的核心问题：用户如何安装 skill、如何让自己的 AI 客户端稳定发现 skill、以及 skill 如何进入用户的默认使用路径。

对标 `npx skills`，更合理的主线应是：

- 作者侧：创建、校验、维护 skill 内容
- 用户侧：安装、链接、卸载、检查 skill
- Agent 侧：把已安装 skill 暴露到具体 AI 客户端的原生消费位置

当前变更尚未归档，适合直接在原变更上纠偏，避免留下两套并行的 skills 方案。

## What Changes

- 保留仓库内 `skills/` 作为 skill 内容与模板的作者侧目录
- 保留 `hs-cli skills new|lint|list` 等作者侧命令
- skill 安装、卸载、agent link、环境检查委托给 `npx skills`（vercel-labs/agent-skills），hs-cli 不重复实现
- 将多来源聚合从”内容查看能力”降级为辅助能力，不再作为产品主线
- 将 MCP server / connect 能力移出当前主线范围，必要时后续以独立变更重新引入

## Capabilities

### New Capabilities

- `ai-skills-authoring`: skill 内容创建与质量校验能力（`new/lint/list`）
- `ai-skills-distribution`: 由 `npx skills` 负责，不在 hs-cli 范围内

### Modified Capabilities

- 现有 `skills` 体系聚焦作者侧，用户侧安装分发交给外部工具

## Impact

- 更新 `openspec/changes/add-ai-skills-toolkit/design.md`
- 更新 `openspec/changes/add-ai-skills-toolkit/tasks.md`
- 更新 `openspec/changes/add-ai-skills-toolkit/specs/ai-skills-management/spec.md`
- 后续调整 `apps/cli/src/commands/skills.ts` 的命令结构与帮助文案
- 后续调整 README 与 Console 中关于 MCP 的说明
