# Changelog

## [0.1.0] - 2026-03-18

### 重构

- 包名从 `create-hs-cli` 改为 `hs-cli`，bin 命令同步更新
- 目录从 `apps/hs-cli/` 重命名为 `apps/cli/`
- 移除 `standard-version`，改为手动管理版本和 CHANGELOG
- CLI 描述更新，去掉"脚手架"定位，改为通用前端开发 CLI 工具

### 功能

- `create`：交互式创建 Vue3 / Nuxt3 项目，支持特性选择
- `generate`：生成 component、page、service、hook 代码文件
- `init`：在当前目录初始化 `hs-cli.config.js` 配置文件
