## Why

当前 `apps/hs-cli` 目录名与 monorepo 根目录名 `hs-cli` 重复，造成路径语义冗余（`hs-cli/apps/hs-cli`）。按照 monorepo 最佳实践，`apps/` 下的目录名应描述其角色（如 `cli`），包名才是对外标识，两者不必相同。

## What Changes

- 将 `apps/hs-cli/` 目录重命名为 `apps/cli/`
- `apps/cli/package.json` 中的 `name` 保持 `hs-cli` 不变
- `apps/cli/package.json` 中的 `bin` 命令保持 `hs-cli` 不变
- 更新根目录 `package.json` 中引用 `apps/hs-cli` 路径的脚本（`publish:cli` 等）
- pnpm workspace 配置无需修改（使用 glob `apps/*`，自动覆盖新目录）

## Capabilities

### New Capabilities

无新功能引入，纯目录结构调整。

### Modified Capabilities

无 spec 级别的行为变更。

## Impact

- `apps/hs-cli/` → `apps/cli/`（本地目录路径变更）
- 根目录 `package.json` 的 `publish:cli` 脚本路径需更新
- pnpm workspace、npm 发布名、bin 命令均不受影响
- CI/CD 若有硬编码 `apps/hs-cli` 路径需同步更新
