## Why

项目目前完全没有测试覆盖，`test` 脚本仅为占位符。随着模板功能和 CLI 命令逐渐增多，缺乏测试会导致回归风险上升，重构和新功能开发缺乏安全网。

## What Changes

- 引入 Vitest 作为测试框架（与项目推荐的模板特性一致）
- 为 `apps/hs-cli` 配置测试环境
- 为 `packages/utils` 配置测试环境
- 补充核心模块的单元测试：
  - CLI 命令解析逻辑（create、generate、init）
  - 模板特征选择与验证逻辑
  - utils 工具函数
- 更新 `package.json` 中的 `test` 脚本为真实可运行命令
- 在 CI 流程中可选接入测试（非本次强制范围）

## Capabilities

### New Capabilities

- `unit-testing`: 为 CLI 核心逻辑和工具函数提供单元测试覆盖，包括命令解析、模板特征验证、utils 函数

### Modified Capabilities

（无现有 spec 需要变更）

## Impact

- 新增开发依赖：`vitest`
- 影响文件：`apps/hs-cli/package.json`、`packages/utils/package.json`、根 `package.json`
- 新增测试目录：`apps/hs-cli/src/__tests__/`、`packages/utils/src/__tests__/`
- 不影响现有构建产物和发布流程
