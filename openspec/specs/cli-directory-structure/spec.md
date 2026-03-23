## Purpose

定义 CLI monorepo 在目录命名、命令资源归属、导入路径稳定性与发布脚本一致性方面的结构规范，确保重构后仍能保持可维护、可扩展且对外行为稳定的工程基线。

## Requirements

### Requirement: CLI 应用目录命名规范
monorepo 中 `apps/` 下的目录名 SHALL 描述其角色而非重复项目名，CLI 入口目录 SHALL 命名为 `cli`。

#### Scenario: 目录路径不重复项目名
- **WHEN** 查看 monorepo 目录结构
- **THEN** CLI 入口路径为 `apps/cli/`，不出现 `apps/hs-cli/` 形式的冗余路径

#### Scenario: 包名与目录名独立
- **WHEN** 查看 `apps/cli/package.json`
- **THEN** `name` 字段为 `hs-cli`，与目录名 `cli` 不同，两者各司其职

### Requirement: 根目录脚本路径与实际目录一致
根目录 `package.json` 中所有引用子包路径的脚本 SHALL 与实际目录名保持一致。

#### Scenario: publish:cli 脚本路径正确
- **WHEN** 执行 `pnpm run publish:cli`
- **THEN** 脚本进入 `apps/cli` 目录并执行发布，不报路径不存在错误

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

### Requirement: npm 发布和 bin 命令不受影响
目录重命名 SHALL NOT 影响 npm 包名、bin 命令名及用户使用方式。

#### Scenario: bin 命令保持可用
- **WHEN** 全局安装 `hs-cli` 包后执行 `hs-cli`
- **THEN** 命令正常运行，与重命名前行为完全一致
