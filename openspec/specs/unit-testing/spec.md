## ADDED Requirements

### Requirement: 测试框架配置
项目 SHALL 在 `apps/cli` 和 `packages/utils` 中配置 Vitest，使 `pnpm test` 可正常运行。

#### Scenario: 根目录运行测试
- **WHEN** 在项目根目录执行 `pnpm test`
- **THEN** 所有包的测试用例被执行，并输出通过/失败结果

#### Scenario: 单包运行测试
- **WHEN** 在 `apps/cli` 目录执行 `pnpm test`
- **THEN** 仅运行该包的测试用例

### Requirement: CLI 命令解析测试
`create`、`generate`、`init` 命令的参数解析逻辑 SHALL 有对应单元测试覆盖。

#### Scenario: create 命令接收项目名称
- **WHEN** 调用 create 命令并传入合法项目名称
- **THEN** 命令正确解析项目名称并进入后续流程

#### Scenario: create 命令缺少必填参数
- **WHEN** 调用 create 命令未传入项目名称
- **THEN** 命令输出错误提示并退出

### Requirement: 模板特征验证测试
模板特征选择与验证逻辑 SHALL 有单元测试，覆盖合法和非法输入。

#### Scenario: 合法特征组合通过验证
- **WHEN** 传入项目支持的特征列表（如 TypeScript、Router）
- **THEN** 验证通过，返回特征配置对象

#### Scenario: 非法特征被拒绝
- **WHEN** 传入不存在的特征名称
- **THEN** 验证失败，抛出或返回错误信息

### Requirement: utils 工具函数测试
`packages/utils` 中导出的工具函数 SHALL 有单元测试，覆盖正常和边界情况。

#### Scenario: 工具函数正常输入
- **WHEN** 以合法参数调用工具函数
- **THEN** 返回预期结果

#### Scenario: 工具函数边界输入
- **WHEN** 以空值或边界值调用工具函数
- **THEN** 函数不抛出未处理异常，返回合理结果或错误
