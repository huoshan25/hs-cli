## Context

项目目前无任何测试覆盖，`test` 脚本为占位符。monorepo 包含两个需要测试的包：`apps/hs-cli`（CLI 核心逻辑）和 `packages/utils`（工具函数）。

## Goals / Non-Goals

**Goals:**
- 引入 Vitest 作为统一测试框架
- 为 CLI 命令解析、模板特征验证、utils 函数补充单元测试
- 让 `pnpm test` 在根目录可运行

**Non-Goals:**
- E2E 测试（不在本次范围）
- CI 集成（可后续跟进）
- 100% 覆盖率（优先覆盖核心逻辑）

## Decisions

**选择 Vitest 而非 Jest**
- 项目推荐的模板特性中已包含 Vitest，保持一致性
- 原生支持 TypeScript，无需额外 transform 配置
- 与 ESM 兼容性更好，速度更快
- 替代方案 Jest 需要额外配置 `ts-jest`，增加复杂度

**测试目录结构：`src/__tests__/`**
- 与源码同级，便于查找
- 替代方案 `tests/` 根目录：与 monorepo 结构不够贴合

**各包独立配置 Vitest**
- 每个包有自己的 `vitest.config.ts`，互不干扰
- 根目录通过 `pnpm -r test` 统一运行

## Risks / Trade-offs

- [CLI 命令依赖交互式 Inquirer] → 需要 mock `inquirer`，测试复杂度略高
- [模板文件路径依赖运行时环境] → 测试中需处理路径 mock 或使用 fixture
