## ADDED Requirements

### Requirement: 命令相关资源聚合在命令目录下
当一个命令拥有专属的资源（模板、处理器等），这些资源 SHALL 聚合在该命令的子目录下，而非放置在 `commands/` 的同级目录。

#### Scenario: create 命令资源聚合
- **WHEN** 查看 `apps/cli/src/commands/` 目录结构
- **THEN** `create/` 为目录，包含 `index.ts`、`templates/`、`templates-handler/`，不存在顶层的 `src/templates/` 或 `src/templates-handler/`

#### Scenario: 单文件命令保持单文件
- **WHEN** 某命令没有附属资源（如 `generate`、`init`）
- **THEN** 该命令保持为单个 `.ts` 文件，不强制创建子目录

#### Scenario: 外部导入路径不变
- **WHEN** `src/index.ts` 导入 `create` 命令
- **THEN** 导入路径仍为 `./commands/create`，Node 自动解析 `create/index.ts`
