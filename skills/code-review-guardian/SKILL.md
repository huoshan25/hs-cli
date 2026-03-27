---
name: code-review-guardian
description: 聚焦代码风险审查，优先发现行为回归、边界漏洞和测试缺口。
license: MIT
compatibility: Requires local workspace files
metadata:
  owner: engineering
  version: "0.1.0"
---

## Purpose

在代码评审中优先识别高风险问题，给出可复现证据与修复建议，避免“只讲风格不讲风险”。

## Trigger

- 用户要求 review、审查 PR、检查改动质量
- 功能发布前的回归检查
- 出现线上问题后进行改动复盘

## Input

- 变更范围（commit/PR/文件列表）
- 相关需求或预期行为
- 测试现状（已有单测/集成测试）

## Steps

1. 先按严重级别（高/中/低）审查行为风险。
2. 检查边界条件、异常流程、并发/状态一致性。
3. 校验类型与契约变化是否兼容。
4. 检查测试覆盖是否匹配改动风险。
5. 输出 findings（含文件路径、原因、建议修复）。

## Output

- Findings 列表（按严重级别排序）
- 每个问题包含：影响、证据、建议
- 未发现问题时明确残余风险和测试盲区

## Guardrails

- 不把“命名/格式”当成主要问题，风险优先。
- 不臆测运行结果，无法验证时要明确说明。
- 建议必须可执行，不给泛化结论。
