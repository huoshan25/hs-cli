## 1. OpenSpec 变更文档

- [x] 1.1 重写 proposal，明确定位：作者侧工具，安装分发委托给 `npx skills`
- [x] 1.2 重写 design，明确作者侧边界与 npx skills 分工
- [x] 1.3 重写 specs，收敛为 new / lint / list 场景

## 2. 作者侧能力整理

- [x] 2.1 保留根目录 `skills/`
- [x] 2.2 保留 `skills/templates/skill-template`
- [x] 2.3 保留 `skills new <name>`
- [x] 2.4 保留 `skills lint [name]`
- [x] 2.5 收敛 `skills list` 为作者侧工作区查看命令

## 3. 安装分发层决策

- [x] 3.1 评估自研安装分发层的必要性
- [x] 3.2 确认 `npx skills`（vercel-labs/agent-skills）已覆盖安装/link/remove/update/find 全流程
- [x] 3.3 决定：安装分发委托给 `npx skills`，hs-cli 不重复实现
- [x] 3.4 删除 `skills-installed.ts`、`skills-agent-adapters.ts`、`skills-git.ts`、`skills-official.ts`
- [x] 3.5 删除 install / add / remove / link / doctor 命令
- [x] 3.6 删除对应单元测试文件

## 4. 清理偏离主线的能力

- [x] 4.1 从 CLI 帮助与 README 中移除 MCP 作为主入口的描述
- [x] 4.2 下线 `skills connect codex`
- [x] 4.3 下线 `skills server mcp`
- [x] 4.4 下线 `skills server http`

## 5. 文档与验证

- [x] 5.1 更新 `apps/cli/README.md` 的 skills 说明，指引用户使用 `npx skills` 安装
- [x] 5.2 更新根 README 的 skills 介绍
- [x] 5.3 对齐 SKILL.md frontmatter 格式（`name`、`description`、`tools`）
- [x] 5.4 更新模板与三个现有 skill 的 SKILL.md
- [x] 5.5 运行 CLI 构建与测试
