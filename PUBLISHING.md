# 发布指南

本项目使用 monorepo 结构，包含多个包：
- `@huo-shan/utils`: 工具函数包
- `hs-cli`: 主 CLI 包

## 发布步骤

### 1. 准备工作

确保你已经登录到 npm：

```bash
npm login
```

### 2. 构建所有包

```bash
pnpm run build:all
```

### 3. 发布包

#### 方式一：一次性发布所有包

```bash
pnpm run publish:all
```

这会按顺序先发布 `@huo-shan/utils` 然后发布 `hs-cli`。

#### 方式二：单独发布包

```bash
# 发布 utils 包
pnpm run publish:utils

# 发布 cli 包
pnpm run publish:cli
```

## 注意事项

1. 发布前，确保版本号已更新（在对应包的 package.json 中）
2. monorepo 中的内部依赖（如 `"@huo-shan/utils": "workspace:*"`）会在发布时通过 `publishConfig` 配置自动转换为正常版本号
3. 每次更改后，确保先构建再发布
4. 如果你更改了 `@huo-shan/utils` 包，记得先发布它，再发布依赖它的 `hs-cli` 包
