## ADDED Requirements

### Requirement: Skills 标准目录结构
系统 SHALL 使用仓库根目录 `skills/` 作为作者侧 AI skills 内容资产目录，并提供模板目录。

#### Scenario: 作者查看仓库 skill 目录
- **WHEN** 开发者在仓库根目录查看 skills 资源
- **THEN** 存在 `skills/templates` 等标准子目录

### Requirement: Skills 创建命令
CLI SHALL 提供 `hs-cli skills new <name>` 命令，用于基于模板创建 skill 目录。

#### Scenario: 创建新 skill
- **WHEN** 执行 `hs-cli skills new my-skill`
- **THEN** 在 `skills/my-skill` 生成标准文件（如 `SKILL.md`、`metadata.yaml`、`examples`、`tests`）

### Requirement: Skills 结构校验命令
CLI SHALL 提供 `hs-cli skills lint [name]` 命令，对单个或全部 workspace skills 做结构校验。

#### Scenario: 校验通过
- **WHEN** skill 目录包含必需文件，且 `metadata.yaml` 的 `description` 满足质量要求
- **THEN** lint 输出通过结果

#### Scenario: 校验失败
- **WHEN** skill 缺失必需文件，或 `description` 缺少有效触发语义
- **THEN** lint 输出失败项并返回非零退出码

### Requirement: Skills 安装分发（不在 hs-cli 范围内）
skill 的安装、卸载、agent link、环境检查等分发操作由外部工具 `npx skills`（vercel-labs/agent-skills）负责，hs-cli 不实现这些命令。

#### Scenario: 用户安装 skill 到 AI 客户端
- **WHEN** 用户执行 `npx skills add https://your-domain.com --skill my-skill`
- **THEN** skill 被安装到对应 agent 的消费目录

#### Scenario: 用户查看已安装状态
- **WHEN** 用户执行 `npx skills list`
- **THEN** 展示当前已安装的 skills 及其 agent 链接状态
