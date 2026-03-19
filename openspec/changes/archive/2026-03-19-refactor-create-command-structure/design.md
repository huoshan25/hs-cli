## Context

当前 `apps/cli/src/` 顶层有 `templates/` 和 `templates-handler/` 两个目录，它们只被 `commands/create.ts` 使用，但与 `commands/` 平级放置，视觉上像是全局共享资源。按命令聚合是 CLI 工具的标准约定。

## Goals / Non-Goals

**Goals:**
- 将 `create` 命令相关的所有代码聚合到 `commands/create/` 目录下
- `create.ts` 改为 `create/index.ts`，保持 Node 模块解析不变
- 更新所有受影响的相对路径引用

**Non-Goals:**
- 不修改任何业务逻辑
- 不调整 `generate`、`init` 命令（它们没有附属资源，保持单文件）
- 不修改 `apps/cli/src/index.ts` 的导入语句（`./commands/create` 自动解析 index.ts）

## Decisions

**create/index.ts 而非 create/create.ts**

使用 `index.ts` 作为入口，外部导入路径 `./commands/create` 不变，Node 自动解析，无需修改 `src/index.ts`。

**templates 和 templates-handler 保持原目录名**

只做移动，不重命名，降低变更范围，减少出错风险。

## Risks / Trade-offs

- [风险] `create/index.ts` 内部引用 `../templates` 等路径需更新 → 移动后逐一检查相对路径
- [风险] 测试文件中的导入路径需同步更新 → 检查 `__tests__/commands/create.test.ts`
