## 1. 环境配置

- [x] 1.1 在 `apps/hs-cli/package.json` 中添加 `vitest` 开发依赖，更新 `test` 脚本为 `vitest run`
- [x] 1.2 在 `packages/utils/package.json` 中添加 `vitest` 开发依赖，更新 `test` 脚本为 `vitest run`
- [x] 1.3 在根 `package.json` 中添加 `test` 脚本为 `pnpm -r test`
- [x] 1.4 在 `apps/hs-cli` 中创建 `vitest.config.ts`，配置 TypeScript 支持和测试目录
- [x] 1.5 在 `packages/utils` 中创建 `vitest.config.ts`，配置 TypeScript 支持和测试目录
- [x] 1.6 执行 `pnpm install` 安装依赖，验证配置无报错

## 2. utils 工具函数测试

- [x] 2.1 阅读 `packages/utils/src` 源码，梳理导出的工具函数列表
- [x] 2.2 创建 `packages/utils/src/__tests__/` 目录，为每个工具函数创建对应测试文件
- [x] 2.3 编写正常输入场景的测试用例
- [x] 2.4 编写边界值和空值场景的测试用例
- [x] 2.5 在 `packages/utils` 目录运行 `pnpm test`，验证全部通过

## 3. CLI 命令解析测试

- [x] 3.1 阅读 `apps/hs-cli/src/commands/` 源码，梳理 create、generate、init 命令的参数结构
- [x] 3.2 创建 `apps/hs-cli/src/__tests__/commands/` 目录
- [x] 3.3 为 `create` 命令编写参数解析测试（合法参数、缺少必填参数）
- [x] 3.4 为 `generate` 命令编写参数解析测试
- [x] 3.5 为 `init` 命令编写参数解析测试
- [x] 3.6 对依赖 Inquirer 的交互逻辑添加 mock，确保测试可独立运行

## 4. 模板特征验证测试

- [x] 4.1 阅读模板特征选择与验证相关源码（`templates-handler` 或类似模块）
- [x] 4.2 创建 `apps/hs-cli/src/__tests__/templates/` 目录
- [x] 4.3 编写合法特征组合通过验证的测试用例
- [x] 4.4 编写非法特征被拒绝的测试用例
- [x] 4.5 在 `apps/hs-cli` 目录运行 `pnpm test`，验证全部通过

## 5. 校验

- [x] 5.1 在项目根目录运行 `pnpm test`，确认所有包测试全部通过
- [x] 5.2 检查测试输出，确认覆盖了 spec 中定义的所有场景
- [x] 5.3 确认 `pnpm build` 仍正常运行，测试配置未影响构建流程
