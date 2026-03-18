## Context

当前 monorepo 结构中，`apps/hs-cli` 目录名与根目录 `hs-cli` 重复，路径读起来是 `hs-cli/apps/hs-cli`，语义冗余。目录名应描述其在 monorepo 中的角色，包名才是对外标识。

## Goals / Non-Goals

**Goals:**
- 将 `apps/hs-cli/` 重命名为 `apps/cli/`
- 保持 npm 包名 `hs-cli` 和 bin 命令 `hs-cli` 不变
- 更新根目录 `package.json` 中硬编码的路径引用

**Non-Goals:**
- 不修改任何业务逻辑或功能
- 不修改 `packages/utils` 的任何内容
- 不修改 pnpm workspace 配置（`apps/*` glob 自动覆盖）

## Decisions

**直接 git mv 而非手动复制**

使用 `git mv apps/hs-cli apps/cli` 保留完整 git 历史，避免文件被识别为新增/删除。

**包名和 bin 命令保持不变**

`apps/cli/package.json` 中 `name: "hs-cli"` 和 `bin: { "hs-cli": "..." }` 均不变，对用户完全透明，不影响 npm 发布和命令使用。

**根目录 package.json 脚本路径更新**

`publish:cli` 脚本中 `cd apps/hs-cli` 需改为 `cd apps/cli`，其余脚本不涉及硬编码路径。

## Risks / Trade-offs

- [风险] CI/CD 若有硬编码 `apps/hs-cli` 路径 → 检查并更新相关配置文件
- [风险] 本地 pnpm 缓存可能需要重新安装 → 执行 `pnpm install` 刷新
