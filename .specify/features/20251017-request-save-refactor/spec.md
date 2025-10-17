# Feature Specification: Fix Paste in Body Editor (Monaco)

## Overview

用户无法在 Body 编辑器中使用快捷键（macOS: Command+V, Windows/Linux: Ctrl+V）粘贴 JSON 请求体内容。该问题自早期版本存在，影响基本使用效率，需要修复以支持可靠的粘贴操作。

## Status

- **Status**: Draft
- **Created**: 2025-10-17
- **Last Updated**: 2025-10-17
- **Priority**: High

## Problem Statement

- 在 Tunder Client 的 Body 编辑器区域（Monaco Editor）中，用户无法通过快捷键进行粘贴操作。
- 期望行为：在 Body 编辑器获得焦点时，使用系统粘贴快捷键可以正常将剪贴板中的 JSON 文本粘贴到编辑器。
- 实际行为：按下粘贴快捷键无反应或被拦截，需要右键菜单/其他方式才能输入文本，严重影响效率。

## User Scenarios & Testing

### 场景 1：粘贴 JSON 到空编辑器
1. 打开 Tunder Client 面板
2. 切换到 Body 标签页，确保 Monaco 编辑器获得焦点
3. 使用快捷键粘贴（macOS: Command+V / Windows: Ctrl+V）一段 JSON 文本
4. 文本应立即出现在编辑器内，并保持语法高亮

验收：
- 粘贴内容完整呈现，无截断/乱码
- 编辑器仍处于 JSON 语言模式，高亮正常

---

### 场景 2：覆盖/插入粘贴
1. 在编辑器已有内容情况下，选择一段文本
2. 使用快捷键粘贴新 JSON 片段
3. 选中内容被替换，或在光标处插入，撤销/重做可用

验收：
- 替换/插入逻辑符合编辑器常规行为
- 撤销（Cmd/Ctrl+Z）与重做（Cmd/Ctrl+Shift+Z / Y）工作正常

---

### 场景 3：大文本粘贴与性能
1. 复制一段≥50KB 的 JSON 文本
2. 粘贴到编辑器

验收：
- 粘贴在 1s 内完成（在一般机器上）
- UI 无明显卡顿，编辑器可继续输入

---

### 场景 4：失焦/非编辑区域
1. 在 URL 输入框或 Headers 表格内按粘贴快捷键
2. 内容应粘贴到当前获得焦点的输入域，而不是编辑器

验收：
- 焦点行为正确，不抢占其它输入域的粘贴事件

## Functional Requirements

- FR-1 粘贴快捷键兼容：在编辑器聚焦时，系统粘贴快捷键可正常工作（macOS: Cmd+V；Windows/Linux: Ctrl+V）。
- FR-2 事件不被拦截：页面上的全局快捷键或事件监听不得拦截/阻止编辑器的粘贴事件。
- FR-3 焦点优先级：仅当 Body 编辑器获得焦点时处理粘贴到编辑器；其它输入域不受影响。
- FR-4 JSON 模式保持：粘贴后保持/恢复 JSON 语言模式与语法高亮。
- FR-5 撤销/重做：粘贴操作进入编辑器历史栈，撤销/重做可用。

## Success Criteria

1. 100% 粘贴快捷键在编辑器聚焦时生效。
2. 无需右键菜单，粘贴在 50ms 内触发输入变更（非大文本场景）。
3. 粘贴后语言模式为 JSON，语法高亮正确。
4. 其他输入控件的粘贴行为不受影响（无抢焦/误粘贴）。
5. 用户反馈问题复现率降为 0（同型号环境复测 10/10 次通过）。

## Assumptions

- VS Code Webview 允许使用剪贴板快捷键（未自定义禁用）。
- CSP 设置允许 `unsafe-eval`/Monaco 正常运行（当前已配置）。
- 没有自定义的 `window` 级别 `keydown`/`paste` 监听阻断默认行为；若存在，需要调整。

## Dependencies

- Webview 的 CSP 配置
- Monaco Editor 事件处理
- 现有全局按键监听/事件委托

## Edge Cases

- 系统剪贴板为空或包含非文本内容
- 用户 OS 层面快捷键被重映射
- 大体量粘贴引发的暂时卡顿（≥ 1MB）
- 粘贴内容非合法 JSON（仍应粘贴，随后格式化/校验由用户触发）

## Out of Scope

- 自定义剪贴板管理
- 粘贴即自动格式化（可作为后续增强）

## Implementation Decisions

- **粘贴后自动格式化**: 否，不自动格式化。避免卡顿体验，用户可手动点击格式化按钮。
- **富文本粘贴支持**: 否，仅支持纯文本。实现简单，符合当前需求。

