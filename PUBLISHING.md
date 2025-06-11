# 发布指南

本项目使用monorepo结构，包含多个包：
- `@huo-shan/utils`: 工具函数包
- `create-hs-cli`: 主CLI包，通过`npm create hs-cli`命令使用

## 发布步骤

### 1. 准备工作

确保你已经登录到npm：

```bash
npm login
```

### 2. 构建所有包

```bash
pnpm run build:all
```

### 3. 发布包

有两种方式发布：

#### 方式一：一次性发布所有包

```bash
pnpm run publish:all
```

这会按顺序先发布`@huo-shan/utils`然后发布`create-hs-cli`。

#### 方式二：单独发布包

如果需要单独发布某个包：

```bash
# 发布utils包
pnpm run publish:utils

# 发布cli包
pnpm run publish:cli
```

## 实现 `npm create hs-cli` 命令

为了让用户能够使用`npm create hs-cli`命令，我们的包名必须是`create-hs-cli`，这是npm的一个特性：

- 当用户运行`npm create foo`时，npm会自动安装`create-foo`包并执行它
- 这等同于`npm init foo`，也等同于`npx create-foo`

所以通过将我们的CLI包命名为`create-hs-cli`并设置正确的bin入口，就可以让用户通过以下命令使用我们的工具：

```bash
# 以下命令都是等价的
npm create hs-cli
npm init hs-cli
npx create-hs-cli
```

## 注意事项

1. 发布前，确保版本号已更新（在对应包的package.json中）
2. monorepo中的内部依赖（如`"@huo-shan/utils": "workspace:*"`）会在发布时通过`publishConfig`配置自动转换为正常版本号
3. 每次更改后，确保先构建再发布
4. 如果你更改了`@huo-shan/utils`包，记得先发布它，再发布依赖它的`create-hs-cli`包 