## 1. 目录重命名

- [x] 1.1 使用 `git mv apps/hs-cli apps/cli` 重命名目录，保留 git 历史

## 2. 配置文件更新

- [x] 2.1 更新根目录 `package.json` 中 `publish:cli` 脚本路径：`cd apps/hs-cli` → `cd apps/cli`

## 3. 验证

- [x] 3.1 确认 `apps/cli/package.json` 中 `name` 仍为 `hs-cli`，`bin` 命令仍为 `hs-cli`
- [x] 3.2 执行 `pnpm install` 确认 workspace 依赖正常解析
- [x] 3.3 在 `apps/cli` 下执行 `pnpm run build` 确认构建成功
- [x] 3.4 确认 `apps/hs-cli` 目录已不存在
