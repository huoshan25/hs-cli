# Node CLI Monorepo

基于 Commander.js 构建的 Node.js CLI 脚手架工具 Monorepo。

## 项目结构

```
.
├── apps                       # 应用程序
│   └── my-cli                 # CLI 脚手架工具
│       ├── bin                # 可执行文件
│       └── src                # 源代码
│           ├── commands       # 命令实现
│           └── templates      # 项目模板
└── packages                   # 共享包
    └── utils                  # 工具函数包
```

## 开发指南

### 安装依赖

```bash
pnpm install
```

### 构建项目

```bash
pnpm build
```

### 运行 CLI

```bash
cd apps/my-cli
pnpm start
```

## 命令

- `create`: 创建一个新项目
- `generate`: 生成组件、页面、服务或 Hook
- `init`: 在当前目录初始化配置

## 示例

```bash
# 创建一个新项目
my-cli create my-app

# 生成一个组件
my-cli generate component Button

# 在当前目录初始化配置
my-cli init
```

## 许可证

MIT 