---
name: openspec-changelog
description: Generate a CHANGELOG entry from an OpenSpec change's artifacts. Use when the user wants to update CHANGELOG.md after completing a change.
license: MIT
metadata:
  author: hs-cli
  version: "1.0"
---

根据 OpenSpec change 的 artifacts 生成 CHANGELOG 条目。

**Input**: 可选指定 change 名称和版本号。未提供时从上下文推断或提示用户选择。

**Steps**

1. **确定 change**

   如果未提供 change 名称：
   - 运行 `openspec list --json` 获取活跃 change
   - 同时检查 `openspec/changes/archive/` 目录下最近的归档
   - 使用 **AskUserQuestion tool** 让用户选择

2. **获取版本号**

   如果用户未提供版本号，使用 **AskUserQuestion tool** 询问：
   > "请输入本次发布的版本号（如 0.2.0）"

3. **读取 change artifacts**

   定位 change 目录（活跃或归档），读取以下文件：
   - `proposal.md`：了解变更动机和 What Changes
   - `specs/**/*.md`：了解新增/修改的能力
   - `tasks.md`：了解具体实现内容

4. **生成 CHANGELOG 条目**

   基于读取的内容，按以下格式生成条目：

   ```markdown
   ## [版本号] - YYYY-MM-DD

   ### 重构
   - 条目...

   ### 功能
   - 条目...

   ### 修复
   - 条目...
   ```

   规则：
   - 只包含有内容的分类，空分类不写
   - 每条描述面向用户，说明影响而非实现细节
   - 语言与项目保持一致（中文）
   - 分类参考：重构、功能、修复、文档、性能、破坏性变更

5. **写入 CHANGELOG.md**

   读取 `apps/cli/CHANGELOG.md`，将新条目插入到文件顶部（`# Changelog` 标题之后）。

6. **展示结果**

   显示生成的条目内容，告知用户已写入 CHANGELOG.md。

**Output On Success**

```
## CHANGELOG 已更新

**Change:** <change-name>
**版本:** <version>
**写入:** apps/cli/CHANGELOG.md

---
<生成的条目内容>
```

**Guardrails**
- 版本号必须由用户提供或确认，不得自动推断
- 条目内容基于 artifacts，不凭空编造
- 不修改 package.json 版本号，版本管理由用户负责
- 如果 CHANGELOG.md 不存在，创建它
