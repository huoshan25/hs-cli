## Why

`templates/` 和 `templates-handler/` 是 `create` 命令的专属实现细节，但目前放在 `src/` 顶层，与其他命令平级，容易误导为全局共享资源。按命令聚合代码是 CLI 工具的标准约定，现在是整理目录结构的好时机。

## What Changes

- `apps/cli/src/commands/create.ts` 改为 `apps/cli/src/commands/create/index.ts`
- `apps/cli/src/templates/` 移动到 `apps/cli/src/commands/create/templates/`
- `apps/cli/src/templates-handler/` 移动到 `apps/cli/src/commands/create/templates-handler/`
- 更新 `create/index.ts` 中的相对路径引用
- 更新测试文件中的导入路径

## Capabilities

### New Capabilities

无新功能引入，纯目录结构调整。

### Modified Capabilities

- `cli-directory-structure`：命令目录结构规范扩展，命令相关资源应聚合在命令目录下

## Impact

- `apps/cli/src/commands/create.ts` → `apps/cli/src/commands/create/index.ts`
- `apps/cli/src/templates/` → `apps/cli/src/commands/create/templates/`
- `apps/cli/src/templates-handler/` → `apps/cli/src/commands/create/templates-handler/`
- `apps/cli/src/__tests__/commands/create.test.ts` 中的导入路径需更新
- `apps/cli/src/index.ts` 中 `import { createCommand } from './commands/create'` 路径不变（Node 自动解析 index.ts）
