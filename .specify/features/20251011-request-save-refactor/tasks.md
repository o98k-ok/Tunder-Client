# 请求实时自动保存 - 任务清单

**Feature**: 请求实时自动保存（简化版）  
**Branch**: feature/20251011-request-save-refactor  
**Estimated Time**: 3-4.5h

---

## 任务执行流程

### Phase 2.1: Extension 命令层 (0.5h)

#### Task 2.1.1: 注册 autoSaveRequest 命令
- **ID**: EXT-001
- **描述**: 在 `extension.ts` 中注册新命令 `httpClient.autoSaveRequest`
- **文件**: `src/extension.ts`
- **依赖**: 无
- **验收**: 
  - [ ] 命令已注册到 `context.subscriptions`
  - [ ] 命令接收 `requestData` 参数
- **优先级**: P0 (必须)

#### Task 2.1.2: 实现自动保存逻辑
- **ID**: EXT-002
- **描述**: 实现命令处理器，调用 `RequestService.updateRequest()` 更新请求
- **文件**: `src/extension.ts`
- **依赖**: EXT-001
- **验收**:
  - [ ] 检查 `requestData.id` 是否存在（安全检查）
  - [ ] 调用 `requestService.updateRequest()` 更新请求
  - [ ] 保存成功后刷新目录树
  - [ ] 发送 `updateSaveStatus` 消息给 Webview
- **优先级**: P0 (必须)

#### Task 2.1.3: 添加错误处理
- **ID**: EXT-003
- **描述**: 处理保存失败场景，返回错误状态
- **文件**: `src/extension.ts`
- **依赖**: EXT-002
- **验收**:
  - [ ] 缺少 `request.id` 时记录错误日志
  - [ ] 保存失败时发送 `error` 状态
  - [ ] 错误信息包含具体原因
- **优先级**: P1 (重要)

---

### Phase 2.2: Webview UI 实现 (2-3h)

#### Task 2.2.1: 添加保存状态指示器 HTML
- **ID**: UI-001
- **描述**: 在 `_getHtmlForWebview()` 中添加保存状态指示器 HTML 结构
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: 无
- **验收**:
  - [ ] 在请求头区域添加 `.save-indicator` 元素
  - [ ] 包含 `.icon` 和 `.text` 子元素
  - [ ] 默认隐藏状态 (`.hidden`)
- **优先级**: P0 (必须)

#### Task 2.2.2: 添加保存状态指示器 CSS
- **ID**: UI-002
- **描述**: 添加四种状态的 CSS 样式（saved/saving/unsaved/error）
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-001
- **验收**:
  - [ ] `.saved` 状态：绿色，图标 ✓
  - [ ] `.saving` 状态：黄色，图标 ⏳
  - [ ] `.unsaved` 状态：灰色，图标 ●
  - [ ] `.error` 状态：红色，图标 ✗
  - [ ] 使用 VSCode CSS 变量保持主题一致
- **优先级**: P0 (必须)

#### Task 2.2.3: 实现防抖函数
- **ID**: UI-003
- **描述**: 在 Webview 脚本中实现 `debounce()` 工具函数
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: 无
- **验收**:
  - [ ] 接受函数和延迟参数
  - [ ] 正确清理和重置定时器
  - [ ] 支持泛型类型
- **优先级**: P0 (必须)

#### Task 2.2.4: 实现 autoSave 函数
- **ID**: UI-004
- **描述**: 实现自动保存核心函数，包含 `currentRequest?.id` 判断
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-003
- **验收**:
  - [ ] 检查 `currentRequest?.id`，无 ID 则跳过
  - [ ] 收集表单数据（URL/Method/Headers/Body）
  - [ ] 发送 `autoSaveRequest` 消息到 Extension
  - [ ] 更新保存状态为 `saving`
- **优先级**: P0 (必须)

#### Task 2.2.5: 创建防抖保存函数
- **ID**: UI-005
- **描述**: 使用 `debounce()` 包装 `autoSave()`，延迟 500ms
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-003, UI-004
- **验收**:
  - [ ] `debouncedAutoSave` 正确创建
  - [ ] 延迟设置为 500ms
- **优先级**: P0 (必须)

#### Task 2.2.6: 监听 URL 输入变化
- **ID**: UI-006
- **描述**: 为 `#url` 输入框添加 `input` 事件监听
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-005
- **验收**:
  - [ ] 检查 `currentRequest?.id`
  - [ ] 更新状态为 `unsaved`
  - [ ] 触发 `debouncedAutoSave()`
- **优先级**: P0 (必须)

#### Task 2.2.7: 监听 Method 选择变化
- **ID**: UI-007
- **描述**: 为 `#method` 下拉框添加 `change` 事件监听
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-005
- **验收**:
  - [ ] 检查 `currentRequest?.id`
  - [ ] 更新状态为 `unsaved`
  - [ ] 触发 `debouncedAutoSave()`
- **优先级**: P0 (必须)

#### Task 2.2.8: 监听 Headers 表格变化
- **ID**: UI-008
- **描述**: 使用事件委托监听 Headers 表格输入变化
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-005
- **验收**:
  - [ ] 在 `#headers-table` 上使用事件委托
  - [ ] 检查事件目标是否为 `.header-input`
  - [ ] 检查 `currentRequest?.id`
  - [ ] 触发 `debouncedAutoSave()`
- **优先级**: P0 (必须)

#### Task 2.2.9: 监听 Monaco Editor 内容变化
- **ID**: UI-009
- **描述**: 为 Monaco Editor 添加 `onDidChangeModelContent` 监听
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-005
- **验收**:
  - [ ] 在 Monaco 初始化后绑定事件
  - [ ] 检查 `currentRequest?.id`
  - [ ] 触发 `debouncedAutoSave()`
- **优先级**: P0 (必须)

#### Task 2.2.10: 实现 updateSaveIndicator 函数
- **ID**: UI-010
- **描述**: 实现保存状态指示器更新函数
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-001, UI-002
- **验收**:
  - [ ] 接受 `status` 和可选 `message` 参数
  - [ ] 检查 `currentRequest?.id`，无 ID 则隐藏指示器
  - [ ] 正确切换 CSS 类
  - [ ] 更新文本内容
- **优先级**: P0 (必须)

#### Task 2.2.11: 处理 updateSaveStatus 消息
- **ID**: UI-011
- **描述**: 在消息监听器中处理 Extension 返回的保存状态
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-010
- **验收**:
  - [ ] 监听 `updateSaveStatus` 消息
  - [ ] 调用 `updateSaveIndicator()`
  - [ ] 正确传递 `status` 和 `message`
- **优先级**: P0 (必须)

#### Task 2.2.12: 优化 updateRequestData 消息处理
- **ID**: UI-012
- **描述**: 加载请求时设置 `currentRequest` 并显示保存状态
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-010
- **验收**:
  - [ ] 设置 `currentRequest = message.data`
  - [ ] 如果有 ID，调用 `updateSaveIndicator('saved')`
  - [ ] 如果无 ID，隐藏指示器
- **优先级**: P0 (必须)

#### Task 2.2.13: 优化 Cmd+S 快捷键 (可选)
- **ID**: UI-013
- **描述**: 监听键盘事件，优化 Cmd+S 行为
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-004
- **验收**:
  - [ ] 监听 `keydown` 事件
  - [ ] 检测 `Cmd+S` 或 `Ctrl+S`
  - [ ] 已保存请求：立即调用 `autoSave()`（跳过防抖）
  - [ ] 新建请求：发送原有 `saveRequest` 消息
- **优先级**: P2 (可选)

#### Task 2.2.14: 添加清理逻辑
- **ID**: UI-014
- **描述**: 在页面卸载时清理防抖定时器
- **文件**: `src/HttpClientPanel.ts`
- **依赖**: UI-005
- **验收**:
  - [ ] 监听 `beforeunload` 事件
  - [ ] 清理防抖定时器
  - [ ] 避免内存泄漏
- **优先级**: P1 (重要)

---

### Phase 2.3: 测试与优化 (0.5-1h)

#### Task 2.3.1: 手动测试场景 1 - 修改已保存请求
- **ID**: TEST-001
- **描述**: 测试已保存请求的自动保存流程
- **依赖**: 所有 UI 和 EXT 任务
- **验收**:
  - [ ] 打开已保存请求
  - [ ] 修改 URL，等待 500ms
  - [ ] 验证状态指示器：unsaved → saving → saved
  - [ ] 关闭后重新打开，验证修改已保存
- **优先级**: P0 (必须)

#### Task 2.3.2: 手动测试场景 2 - 新建请求不自动保存
- **ID**: TEST-002
- **描述**: 测试新建请求不触发自动保存
- **依赖**: 所有 UI 和 EXT 任务
- **验收**:
  - [ ] 打开空白面板
  - [ ] 输入 URL 和配置，等待 > 500ms
  - [ ] 验证控制台日志："跳过：新建请求不自动保存"
  - [ ] 验证没有触发保存
  - [ ] 按 Cmd+S，弹出命名对话框
  - [ ] 保存后修改，验证触发自动保存
- **优先级**: P0 (必须)

#### Task 2.3.3: 手动测试场景 3 - 快速连续修改
- **ID**: TEST-003
- **描述**: 测试防抖机制是否正常工作
- **依赖**: 所有 UI 和 EXT 任务
- **验收**:
  - [ ] 打开已保存请求
  - [ ] 快速连续修改 URL、Headers、Body
  - [ ] 验证只在最后一次修改后 500ms 触发一次保存
  - [ ] 检查日志，确认只有一次保存操作
- **优先级**: P0 (必须)

#### Task 2.3.4: 手动测试场景 4 - Cmd+S 快捷键
- **ID**: TEST-004
- **描述**: 测试 Cmd+S 快捷键行为
- **依赖**: UI-013
- **验收**:
  - [ ] 打开已保存请求并修改
  - [ ] 立即按 Cmd+S
  - [ ] 验证立即触发保存（不等待 500ms）
  - [ ] 打开新建请求
  - [ ] 按 Cmd+S，验证弹出命名对话框
- **优先级**: P2 (可选)

#### Task 2.3.5: 性能测试
- **ID**: TEST-005
- **描述**: 测试快速输入时不卡顿
- **依赖**: 所有 UI 和 EXT 任务
- **验收**:
  - [ ] 在 Body 中快速输入大量文本
  - [ ] 验证 UI 不卡顿
  - [ ] 验证防抖正常工作
- **优先级**: P1 (重要)

#### Task 2.3.6: 边界测试
- **ID**: TEST-006
- **描述**: 测试边界场景
- **依赖**: 所有 UI 和 EXT 任务
- **验收**:
  - [ ] 测试空白面板（无 `currentRequest`）
  - [ ] 测试空 URL、空 Body
  - [ ] 测试特殊字符输入
  - [ ] 测试保存失败场景（模拟）
- **优先级**: P1 (重要)

#### Task 2.3.7: 代码审查与优化
- **ID**: TEST-007
- **描述**: 审查代码质量，移除调试日志
- **依赖**: 所有测试任务
- **验收**:
  - [ ] 移除或注释调试 `console.log`
  - [ ] 检查代码格式和命名规范
  - [ ] 优化性能瓶颈（如有）
  - [ ] 添加必要的注释
- **优先级**: P1 (重要)

#### Task 2.3.8: 编译和 Lint 检查
- **ID**: TEST-008
- **描述**: 编译 TypeScript 并修复 Lint 错误
- **依赖**: TEST-007
- **验收**:
  - [ ] 运行 `npm run compile`，无编译错误
  - [ ] 运行 Lint 检查（如有），无严重错误
- **优先级**: P0 (必须)

---

## 任务统计

- **总任务数**: 26
- **P0 (必须)**: 20
- **P1 (重要)**: 5
- **P2 (可选)**: 1

---

## 执行顺序

1. **Phase 2.1** (顺序执行): EXT-001 → EXT-002 → EXT-003
2. **Phase 2.2** (按依赖执行): 
   - 并行组 1: UI-001, UI-002, UI-003
   - 顺序: UI-004 → UI-005
   - 并行组 2: UI-006, UI-007, UI-008, UI-009
   - 顺序: UI-010 → UI-011, UI-012
   - 可选: UI-013, UI-014
3. **Phase 2.3** (顺序执行): TEST-001 → TEST-002 → TEST-003 → TEST-004 → TEST-005 → TEST-006 → TEST-007 → TEST-008

---

## 完成标准

所有 P0 和 P1 任务的验收标准全部通过，P2 任务可选。

