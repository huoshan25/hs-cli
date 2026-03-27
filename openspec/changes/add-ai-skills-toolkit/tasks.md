## 1. OpenSpec 变更文档

- [x] 1.1 重写 proposal，明确从“管理 + MCP”纠偏为“作者侧 + 安装分发”
- [x] 1.2 重写 design，明确用户安装目录、lockfile 与 Agent adapter 方案
- [x] 1.3 重写 specs，定义安装、链接、卸载、环境检查的需求与场景

## 2. 作者侧能力整理

- [x] 2.1 保留根目录 `skills/`
- [x] 2.2 保留 `skills/templates/skill-template`
- [x] 2.3 保留 `skills new <name>`
- [x] 2.4 保留 `skills lint [name]`
- [x] 2.5 评估 `skills list` 是否保留为作者侧查看命令，并收敛其输出语义
- [x] 2.6 移除或降级 `skills source add/list/remove`，避免继续强化多来源聚合主线

## 3. 用户侧安装分发能力

- [x] 3.1 新增用户安装目录解析逻辑（默认 `~/.hs-cli/skills/installed`）
- [x] 3.2 设计并实现 skill lockfile 读写
- [x] 3.3 实现 `skills install <source>`
- [x] 3.4 实现 `skills remove <name>`
- [x] 3.5 实现 `skills link <name> --agent codex`
- [x] 3.6 实现 `skills doctor`
- [x] 3.7 抽象 Agent adapter 接口，并落地 Codex adapter

## 4. 清理偏离主线的能力

- [x] 4.1 从 CLI 帮助与 README 中移除 MCP 作为主入口的描述
- [x] 4.2 评估并下线 `skills connect codex`
- [x] 4.3 评估并下线 `skills server mcp`
- [x] 4.4 评估并下线 `skills server http`
- [x] 4.5 调整 Console Skills 页面，弱化 MCP 区块，改为安装/链接状态视图

## 5. 文档与验证

- [x] 5.1 更新 `apps/cli/README.md` 的 skills 使用说明，改成 install/link/doctor 主路径
- [x] 5.2 更新根 README 的 skills 介绍
- [x] 5.3 增加安装目录、lockfile、agent adapter 的单元测试
- [x] 5.4 运行 CLI 构建与测试
- [x] 5.5 运行 `openspec validate --strict`
