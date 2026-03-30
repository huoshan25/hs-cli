# npx skills (vercel-labs/agent-skills) 技术研究报告

## 核心架构

两个仓库，职责不同：

| 仓库 | npm 包 | 职责 |
|------|--------|------|
| `vercel-labs/skills` | `skills`（CLI 工具） | `npx skills add ...` 命令本体 |
| `vercel-labs/agent-skills` | 无 npm 包 | skill 内容仓库，纯 Git |

---

## 支持的安装来源

### 1. Git 仓库（主流）

```bash
# GitHub shorthand（最常用）
npx skills add owner/repo

# 指定子路径（单个 skill）
npx skills add owner/repo/skills/my-skill

# 安装全部 skill
npx skills add owner/repo --skill '*'

# 指定 skill 名过滤
npx skills add owner/repo --skill react-best-practices

# 完整 GitHub URL
npx skills add https://github.com/owner/repo

# 指定 branch + 子路径
npx skills add https://github.com/owner/repo/tree/main/skills/my-skill

# GitLab
npx skills add gitlab:org/repo
npx skills add https://gitlab.com/org/repo

# SSH Git URL
npx skills add git@github.com:owner/repo.git

# 任意 Git 服务器
npx skills add https://git.company.com/group/repo.git
```

### 2. 本地路径

```bash
npx skills add ./skills/my-skill
npx skills add /absolute/path/to/skill
```

### 3. npm 包（间接，通过 experimental_sync）

```bash
# 先安装 npm 包
npm install @org/my-skills

# 再同步到各 agent
npx skills experimental_sync
```

### 4. Well-Known 协议（企业/产品集成）

```bash
npx skills add https://example.com
```

需要在域名部署：

```
https://example.com/.well-known/agent-skills/index.json
https://example.com/.well-known/agent-skills/my-skill/SKILL.md
```

`index.json` 格式：

```json
{
  "skills": [
    {
      "name": "my-skill",
      "description": "skill 描述",
      "files": ["SKILL.md"]
    }
  ]
}
```

---

## ❌ 不支持的格式

```bash
# npm: 前缀 —— 不存在，源码无此解析逻辑
npx skills add npm:@org/my-skill   # ❌ 无效
```

---

## npm 包内的 skill 目录结构

`experimental_sync` 扫描 `node_modules` 时，识别优先级：

```
node_modules/my-package/
├── SKILL.md               ← ✅ 优先（单 skill 包）
│
├── skills/                ← ✅ 多 skill（推荐）
│   ├── skill-a/
│   │   └── SKILL.md
│   └── skill-b/
│       └── SKILL.md
│
└── .agents/skills/        ← ✅ 备选目录
    └── skill-c/
        └── SKILL.md
```

---

## SKILL.md 标准格式

```markdown
---
name: my-skill                      # 必填，小写+连字符，1-64字符
description: 当用户请求 xxx 时...    # 必填，写触发场景而非功能描述
license: MIT
metadata:
  author: yourname
  version: "1.0.0"
  internal: false                   # true 则默认隐藏（WIP skill 用）
---

# Skill 标题

## When to Use
明确列出触发关键词和场景

## Steps
1. 步骤一
2. 步骤二
```

**name 规范：** `[a-z0-9][a-z0-9-]{0,62}[a-z0-9]`

---

## 发布最佳实践

### 方式 A：Git 仓库（零成本，官方推荐）

```
my-skills-repo/
├── skills/
│   ├── skill-a/
│   │   ├── SKILL.md
│   │   └── examples/
│   └── skill-b/
│       └── SKILL.md
```

用户安装：

```bash
npx skills add yourorg/my-skills-repo
npx skills add yourorg/my-skills-repo/skills/skill-a  # 单个
```

### 方式 B：npm 集合包（一次装全部）

```
packages/skills/
├── package.json     ← { "name": "@org/skills", "keywords": ["agent-skills"] }
├── skills/
│   ├── skill-a/
│   │   └── SKILL.md
│   └── skill-b/
│       └── SKILL.md
```

用户安装：

```bash
npm install @org/skills
npx skills experimental_sync
```

---

## 对 hs-cli 的建议

| 场景 | 推荐方案 |
|------|---------|
| 仓库内开发者 | 面板复制绝对路径，直接 `npx skills add /abs/path/xxx` |
| 公司同事（迁移后）| `npm install @huo-shan/skills` + `npx skills experimental_sync` |
| 外部开源用户 | `npx skills add huo-shan25/hs-cli/packages/skills/xxx` |

**结构调整建议：**

- `packages/skills/` 整体发一个包 `@huo-shan/skills`，删掉每个 skill 单独的 `package.json`
- 里面的 skill 放到 `skills/` 子目录（符合 `experimental_sync` 扫描规范）
- 删掉 `npmPackage` 字段（`npm:` 前缀不存在，之前的设计有误）
- 面板安装命令：本地用绝对路径，外部用 Git shorthand
