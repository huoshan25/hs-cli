## Purpose

定义 OpenSpec Web 面板在 CLI 中的核心能力边界，确保 Web 交互与 OpenSpec 现有工作流保持一致。

## Requirements

### Requirement: OpenSpec Web 面板入口
CLI SHALL 支持通过 `hs-cli openspec --ui web` 启动 Web 面板，并在面板中展示 OpenSpec 项目结构与详情。

#### Scenario: 使用 web 模式启动面板
- **WHEN** 用户执行 `hs-cli openspec --ui web`
- **THEN** CLI 启动本地 Web 面板并加载 OpenSpec 数据

#### Scenario: 默认模式可自动进入 Web 面板
- **WHEN** 用户执行 `hs-cli openspec` 且环境满足 Web 面板启动条件
- **THEN** CLI 可进入 Web 面板进行浏览与操作

### Requirement: 面板信息架构
Web 面板 SHALL 提供与 CLI/TUI 等价的核心信息架构：概览、提案、变更、归档，以及对应详情区。

#### Scenario: 左侧列表切换
- **WHEN** 用户切换 `概览 / 提案 / 变更 / 归档` 标签
- **THEN** 左侧列表与右侧详情同步切换到对应数据视图

#### Scenario: 详情区文件查看
- **WHEN** 详情存在多个源文件（如 `proposal.md`、`tasks.md`、`design.md`）
- **THEN** 用户可在文件标签间切换查看内容

### Requirement: Markdown 与图文渲染
Web 面板 SHALL 支持 Markdown 渲染、代码高亮与 Mermaid 图渲染，并提供原文/渲染视图切换。

#### Scenario: Markdown 内容渲染
- **WHEN** 详情文件为 Markdown
- **THEN** 面板渲染标题、列表、代码块、引用等基础结构

#### Scenario: Mermaid 语法渲染
- **WHEN** Markdown 中包含 Mermaid 代码块
- **THEN** 面板可渲染图表并在渲染失败时保持可读回退

### Requirement: 变更动作执行
在变更详情中，面板 SHALL 支持执行 `严格验证` 与 `确认归档`，并展示执行状态与输出日志。

#### Scenario: 执行严格验证
- **WHEN** 用户在变更详情触发“严格验证”
- **THEN** 面板调用后端动作接口并显示命令结果与状态

#### Scenario: 执行确认归档
- **WHEN** 用户在变更详情触发“确认归档”并确认操作
- **THEN** 面板执行归档动作，刷新数据并反馈执行结果

### Requirement: 项目切换与全局搜索
Web 面板 SHALL 提供项目切换（Project Hub）与全局搜索（Palette）能力，支持键盘导航。

#### Scenario: 项目中心切换项目
- **WHEN** 用户打开项目中心并选择目标项目
- **THEN** 面板切换到目标项目并刷新列表与详情

#### Scenario: 全局搜索跳转
- **WHEN** 用户通过 `Cmd/Ctrl + K` 打开搜索并选中结果
- **THEN** 面板跳转到对应标签与条目位置

### Requirement: 主题与快捷键
Web 面板 SHALL 支持深浅主题切换与核心快捷键操作。

#### Scenario: 主题切换
- **WHEN** 用户触发主题切换操作（按钮或快捷键）
- **THEN** 面板在深色与浅色主题间切换并保持可读性

#### Scenario: 常用快捷键
- **WHEN** 用户使用 `/`、`1/2/3/4`、`j/k`、`f`、`p`、`o`、`Esc` 等快捷键
- **THEN** 面板执行对应导航、筛选、弹层开关或关闭行为
