---
name: release-changelog-builder
description: 从改动记录自动生成结构化发布说明、升级提示与回滚要点。
license: MIT
compatibility: Requires local workspace files
metadata:
  owner: release
  version: "0.1.0"
---

## Purpose

把分散的 commit/功能变更整理成可发布的 changelog，减少漏项并提升可读性。

## Trigger

- 用户要准备发版说明
- 需要从 commit 历史快速汇总版本变更
- 需要输出给研发/测试/运营不同视角的发布内容

## Input

- 版本号与发布时间
- commit 列表或变更摘要
- 影响模块、破坏性变更、迁移说明

## Steps

1. 汇总改动并按类别分组（feat/fix/refactor/docs/chore）。
2. 识别破坏性变更与迁移步骤。
3. 提炼面向用户的价值描述，避免纯技术堆砌。
4. 生成标准结构：Highlights、Fixes、Breaking Changes、Upgrade Notes。
5. 输出短版（公告）+ 长版（技术明细）可选内容。

## Output

- 可直接发布的 changelog（Markdown）
- 版本亮点、问题修复、兼容性说明、回滚建议
- 可复制到 release note 的文本块

## Guardrails

- 不杜撰不存在的改动项。
- 模糊信息要标记“需确认”。
- 破坏性变更必须显式标注，不可省略。
