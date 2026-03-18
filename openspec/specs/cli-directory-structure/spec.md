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

### Requirement: npm 发布和 bin 命令不受影响
目录重命名 SHALL NOT 影响 npm 包名、bin 命令名及用户使用方式。

#### Scenario: bin 命令保持可用
- **WHEN** 全局安装 `hs-cli` 包后执行 `hs-cli`
- **THEN** 命令正常运行，与重命名前行为完全一致
