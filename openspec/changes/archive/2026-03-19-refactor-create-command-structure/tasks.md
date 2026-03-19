## 1. 目录结构调整

- [x] 1.1 创建 `apps/cli/src/commands/create/` 目录
- [x] 1.2 将 `apps/cli/src/commands/create.ts` 移动为 `apps/cli/src/commands/create/index.ts`
- [x] 1.3 将 `apps/cli/src/templates/` 移动到 `apps/cli/src/commands/create/templates/`
- [x] 1.4 将 `apps/cli/src/templates-handler/` 移动到 `apps/cli/src/commands/create/templates-handler/`

## 2. 路径引用更新

- [x] 2.1 更新 `create/index.ts` 中 `TemplateFactory` 的导入路径（`../templates-handler` → `./templates-handler`）
- [x] 2.2 更新 `create/index.ts` 中 `path.resolve(__dirname, '../templates')` 为 `path.resolve(__dirname, './templates')`

## 3. 验证

- [x] 3.1 更新 `apps/cli/src/__tests__/commands/create.test.ts` 中的导入路径
- [x] 3.2 执行 `pnpm run build` 确认 TypeScript 编译无报错
- [x] 3.3 确认 `apps/cli/src/templates/` 和 `apps/cli/src/templates-handler/` 顶层目录已不存在
