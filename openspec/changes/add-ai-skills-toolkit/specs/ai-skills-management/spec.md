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

### Requirement: 用户 skill 安装目录
CLI SHALL 使用独立于当前工作区的用户目录管理已安装 skills。

#### Scenario: 安装 skill 到用户目录
- **WHEN** 用户执行 `hs-cli skills add <source>`
- **THEN** CLI 将 skill 写入默认用户安装目录
- **AND** 安装结果不依赖原工作区路径持续存在

### Requirement: Skills 安装状态记录
CLI SHALL 为每个已安装 skill 写入可追踪的安装状态文件。

#### Scenario: 写入 skill lockfile
- **WHEN** skill 安装成功
- **THEN** 安装目录中存在 lockfile
- **AND** lockfile 至少包含 skill id、version、source、installedAt 和 linked agents 信息

### Requirement: Skills 添加命令
CLI SHALL 提供 `hs-cli skills add <source>` 命令，作为用户侧主命令，将 workspace 或本地来源的 skill 安装到用户目录，并默认接入目标 agent。

#### Scenario: 从工作区添加 skill
- **WHEN** 用户执行 `hs-cli skills add my-skill`
- **THEN** CLI 校验源 skill 结构
- **AND** 将 skill 安装到用户目录
- **AND** 默认链接到 Codex
- **AND** 输出安装结果与目标路径

### Requirement: Skills 卸载命令
CLI SHALL 提供 `hs-cli skills remove <name>` 命令，用于删除已安装 skill，并清理相关 agent link。

#### Scenario: 卸载已安装 skill
- **WHEN** 用户执行 `hs-cli skills remove my-skill`
- **THEN** 已安装目录被删除
- **AND** 已建立的 agent link 被清理

### Requirement: Agent Link 命令
CLI SHALL 提供 `hs-cli skills link <name> --agent <agent>` 命令，将已安装 skill 链接到指定 AI 客户端的原生消费目录。

#### Scenario: 链接到 Codex
- **WHEN** 用户执行 `hs-cli skills link my-skill --agent codex`
- **THEN** CLI 使用 Codex adapter 解析目标目录
- **AND** 将 skill 链接或复制到该目录
- **AND** lockfile 中记录 `codex` 已链接

### Requirement: Agent Adapter 可扩展
系统 SHALL 使用 adapter 机制隔离不同 AI 客户端的目录解析与 link 策略。

#### Scenario: 增加新 agent
- **WHEN** 后续需要支持新的 AI 客户端
- **THEN** 实现可通过新增 adapter 完成，而无需重写安装模型

### Requirement: Skills 环境检查命令
CLI SHALL 提供 `hs-cli skills doctor` 命令，检查用户安装环境与 agent link 状态。

#### Scenario: 发现失效 link
- **WHEN** 用户执行 `hs-cli skills doctor`
- **AND** 某个 agent link 指向不存在的安装目录
- **THEN** CLI 输出失效项
- **AND** 给出明确修复建议
