---
name: spec-proposal-writer
description: 为需求生成可执行的 OpenSpec proposal/design/tasks，并补充边界与验收标准。
license: MIT
compatibility: Requires local workspace files
metadata:
  owner: platform
  version: "0.1.0"
---

## Purpose

把模糊需求转成可落地的 OpenSpec 变更提案，输出 proposal、design、tasks 和 spec requirement/scenario。

## Trigger

- 用户说“做一个新功能”“需要方案/设计/任务拆解”“按 openspec 走需求”
- 需要快速形成可评审的变更文档，而不是只停留在聊天结论

## Input

- 目标功能描述
- 业务边界（必须做/不做）
- 影响范围（模块、目录、接口）
- 非功能要求（性能、安全、兼容性）

## Steps

1. 先澄清需求边界，列出关键假设与风险。
2. 生成 OpenSpec change：proposal、design、tasks、spec。
3. tasks 按可执行步骤拆分，并标注验证方式。
4. spec 用 SHALL + Scenario 描述行为，不写实现细节。
5. 运行 validate（或给出可执行校验命令）并返回结果。

## Output

- 结构化 proposal（目标、范围、影响、风险）
- design（架构方案、数据流、权衡）
- tasks（可执行检查项）
- specs（requirements + scenarios）
- 校验命令及结果摘要

## Guardrails

- 不编造不存在的文件、命令或接口。
- 遇到不确定项先列假设，必要时明确需要用户确认。
- 避免“空泛建议”，必须落到文件路径、命令、验收标准。
