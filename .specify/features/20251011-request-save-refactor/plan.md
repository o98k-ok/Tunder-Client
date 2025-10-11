# 请求实时自动保存 - 实施计划（简化版）

## 功能概述
将手动 Cmd+S 保存机制优化为：已保存请求自动保存，新建请求保持手动保存流程。

**简化说明**: 不实现草稿功能，只对已有 ID 的请求进行自动保存，大幅简化实现复杂度。

## 状态
- **Status**: Planning
- **Created**: 2025-10-11
- **Feature Spec**: [spec.md](./spec.md)

---

## 技术背景

### 核心实现逻辑

**判断条件**:
```typescript
// 只有已保存的请求才触发自动保存
if (currentRequest?.id) {
  debouncedAutoSave();  // 500ms 后自动保存
}
```

**数据流**:
```
用户修改输入 → 检查 currentRequest?.id → 
  ✅ 有 ID: 触发防抖自动保存 → RequestService.updateRequest()
  ❌ 无 ID: 不触发自动保存，保持原有流程
```

---

## 章程合规检查

### 原则 1: 接口文档完整性 ✅
- VSCode API:
  - `vscode.commands.executeCommand` - [Commands API](https://code.visualstudio.com/api/references/vscode-api#commands)
  - `panel.webview.postMessage` - [Webview API](https://code.visualstudio.com/api/extension-guides/webview)
- Monaco Editor API:
  - `editor.onDidChangeModelContent` - [Events](https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.IStandaloneCodeEditor.html#onDidChangeModelContent)

### 原则 2: 执行明确性 ✅
- 明确只对已保存请求自动保存
- 防抖延迟明确为 500ms
- 新建请求保持原有手动流程

### 原则 3: 业务理解 ✅
- 用户场景已确认：已保存请求自动保存，新建请求手动保存
- 去掉草稿功能，保持流程简单

### 原则 4: 代码复用 ✅
- **完全复用现有代码**，无需新增数据层方法
- 复用 `RequestService.updateRequest()`
- 复用 `DirectoryTreeProvider.refresh()`

### 原则 5: 测试规范 ⚠️
- 行动项：Phase 3 添加单元测试

### 原则 6: 架构一致性 ✅
- 不修改数据模型
- 不改变现有架构
- 仅在 Webview 层添加监听逻辑

### 原则 7: 知识诚实 ✅
- 明确标记需要研究的技术点（见 Phase 0）

### 原则 8: 重构谨慎 ✅
- 分阶段实施，每阶段可独立验证
- 完全向后兼容

---

## Phase 0: 技术研究

### R1: 防抖函数实现

**推荐方案**:
```typescript
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  return function(...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 使用
const debouncedAutoSave = debounce(() => {
  if (currentRequest?.id) {  // 关键判断
    autoSave();
  }
}, 500);
```

### R2: 保存状态指示器 UI

**位置**: 请求名称旁边

**HTML**:
```html
<div class="request-header">
  <input type="text" id="request-name" placeholder="Untitled Request">
  <div class="save-indicator" id="save-indicator">
    <span class="icon"></span>
    <span class="text">已保存</span>
  </div>
</div>
```

**CSS** (四种状态):
- `saved`: 绿色 ✓
- `saving`: 黄色 ⏳
- `unsaved`: 灰色 ●
- `error`: 红色 ✗

---

## Phase 1: 数据模型与契约

### 1.1 数据模型

**无需修改**，保持现有 `Request` 接口不变。

### 1.2 消息契约

#### Webview → Extension

**新增消息**: `autoSaveRequest`
```typescript
{
  command: 'autoSaveRequest',
  data: {
    id: string,                       // 必填（已保存请求的 ID）
    name: string,
    url: string,
    method: string,
    headers: Array<{ key: string; value: string }>,
    body: string
  }
}
```

#### Extension → Webview

**新增消息**: `updateSaveStatus`
```typescript
{
  command: 'updateSaveStatus',
  status: 'saved' | 'saving' | 'unsaved' | 'error',
  message?: string                    // 错误信息
}
```

### 1.3 API 契约

**无需新增方法**，复用现有：
- `RequestService.updateRequest(id, data)` - 更新请求
- `DirectoryTreeProvider.refresh()` - 刷新目录树

---

## Phase 2: 实施任务分解

### 阶段 2.1: Extension 命令层 (0.5h)

**任务**:
1. ✅ 在 `extension.ts` 中注册新命令 `httpClient.autoSaveRequest`
2. ✅ 实现逻辑：
   ```typescript
   context.subscriptions.push(
     vscode.commands.registerCommand(
       'httpClient.autoSaveRequest',
       async (requestData: any) => {
         if (!requestData.id) {
           // 安全检查：没有 ID 不应该调用此命令
           console.error('[AutoSave] 缺少请求 ID');
           return;
         }
         
         const updated = requestService.updateRequest(requestData.id, {
           name: requestData.name,
           url: requestData.url,
           method: requestData.method,
           headers: requestData.headers || [],
           body: requestData.body || '',
           updated_at: Date.now()
         });
         
         if (updated) {
           // 静默保存成功，刷新目录树
           directoryTreeProvider.refresh();
           
           // 通知 Webview
           HttpClientPanel.currentPanel?._panel.webview.postMessage({
             command: 'updateSaveStatus',
             status: 'saved'
           });
         } else {
           // 保存失败
           HttpClientPanel.currentPanel?._panel.webview.postMessage({
             command: 'updateSaveStatus',
             status: 'error',
             message: '保存失败'
           });
         }
       }
     )
   );
   ```

**验收**:
- 执行命令可成功更新请求
- 保存失败时返回错误状态

---

### 阶段 2.2: Webview UI 实现 (2-3h)

**任务**:

**1. 添加保存状态指示器 HTML**:
```html
<div class="request-header">
  <input type="text" id="request-name" placeholder="Untitled Request">
  <div class="save-indicator hidden" id="save-indicator">
    <span class="icon"></span>
    <span class="text">已保存</span>
  </div>
</div>
```

**2. 添加 CSS 样式** (见 research.md)

**3. 实现防抖函数和自动保存逻辑**:
```typescript
// 防抖函数
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  return function(...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// 自动保存函数
function autoSave() {
  // 关键判断：只有已保存的请求才自动保存
  if (!currentRequest?.id) {
    console.log('[AutoSave] 跳过：新建请求不自动保存');
    return;
  }
  
  updateSaveIndicator('saving');
  
  const requestData = {
    id: currentRequest.id,
    name: (document.getElementById('request-name') as HTMLInputElement)?.value || '',
    url: (document.getElementById('url') as HTMLInputElement)?.value || '',
    method: (document.getElementById('method') as HTMLSelectElement)?.value || 'GET',
    headers: getHeadersArray(),
    body: bodyEditor?.getValue() || ''
  };
  
  vscode.postMessage({
    command: 'autoSaveRequest',
    data: requestData
  });
}

// 创建防抖保存函数
const debouncedAutoSave = debounce(autoSave, 500);
```

**4. 监听输入变化**:
```typescript
// URL 输入
document.getElementById('url')?.addEventListener('input', () => {
  if (currentRequest?.id) {
    updateSaveIndicator('unsaved');
    debouncedAutoSave();
  }
});

// Method 选择
document.getElementById('method')?.addEventListener('change', () => {
  if (currentRequest?.id) {
    updateSaveIndicator('unsaved');
    debouncedAutoSave();
  }
});

// Headers 表格（事件委托）
document.getElementById('headers-table')?.addEventListener('input', (e) => {
  if ((e.target as HTMLElement).classList.contains('header-input')) {
    if (currentRequest?.id) {
      updateSaveIndicator('unsaved');
      debouncedAutoSave();
    }
  }
});

// Monaco Editor
if (bodyEditor) {
  bodyEditor.onDidChangeModelContent(() => {
    if (currentRequest?.id) {
      updateSaveIndicator('unsaved');
      debouncedAutoSave();
    }
  });
}
```

**5. 实现保存状态更新**:
```typescript
function updateSaveIndicator(
  status: 'saved' | 'saving' | 'unsaved' | 'error',
  message?: string
) {
  const indicator = document.getElementById('save-indicator');
  if (!indicator) return;

  // 只对已保存请求显示指示器
  if (!currentRequest?.id) {
    indicator.classList.add('hidden');
    return;
  }
  
  indicator.classList.remove('hidden');
  indicator.classList.remove('saved', 'saving', 'unsaved', 'error');
  indicator.classList.add(status);

  const textEl = indicator.querySelector('.text');
  if (textEl) {
    const statusText = {
      saved: '已保存',
      saving: '保存中...',
      unsaved: '有未保存更改',
      error: message || '保存失败'
    };
    textEl.textContent = statusText[status];
  }
}
```

**6. 处理 Extension 消息**:
```typescript
window.addEventListener('message', (event) => {
  const message = event.data;
  
  switch (message.command) {
    case 'updateSaveStatus':
      updateSaveIndicator(message.status, message.message);
      break;
      
    case 'updateRequestData':
      // 加载请求时，设置 currentRequest
      currentRequest = message.data;
      // ... 更新 UI
      
      // 显示保存状态指示器（已保存）
      if (currentRequest?.id) {
        updateSaveIndicator('saved');
      }
      break;
  }
});
```

**7. 优化 Cmd+S 快捷键** (可选):
```typescript
// 监听键盘事件
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    
    if (currentRequest?.id) {
      // 已保存请求：立即触发保存（跳过防抖）
      autoSave();
    } else {
      // 新建请求：调用原有保存命令
      vscode.postMessage({ command: 'saveRequest', data: collectRequestData() });
    }
  }
});
```

**验收**:
- 修改已保存请求的任意字段后 500ms 触发自动保存
- 新建请求不触发自动保存
- 保存状态指示器正确显示四种状态
- 连续修改时防抖计时器正确重置

---

### 阶段 2.3: 测试与优化 (0.5-1h)

**任务**:
1. ✅ 手动测试所有用户场景（场景 1-3）
2. ✅ 性能测试：快速输入时不卡顿
3. ✅ 边界测试：
   - 空白面板（无 `currentRequest`）
   - 加载已保存请求后修改
   - 快速连续修改多个字段
4. ✅ 修复发现的 bug
5. ✅ 代码审查与优化

**验收**:
- 所有验收标准通过
- 无明显性能问题
- 无误判请求状态

---

## Phase 3: 测试计划（简化）

### 手动测试清单

#### 场景 1: 修改已保存请求
- [ ] 从目录树打开已保存请求
- [ ] 修改 URL
- [ ] 等待 500ms
- [ ] 验证保存状态指示器从"有未保存更改"→"保存中..."→"已保存"
- [ ] 关闭后重新打开，验证修改已保存

#### 场景 2: 新建请求不自动保存
- [ ] 打开空白面板
- [ ] 输入 URL 和配置
- [ ] 等待 > 500ms
- [ ] 验证没有触发保存（检查控制台日志："跳过：新建请求不自动保存"）
- [ ] 按 Cmd+S，弹出命名对话框
- [ ] 保存后，修改 URL
- [ ] 验证此时触发自动保存

#### 场景 3: 快速连续修改
- [ ] 打开已保存请求
- [ ] 快速连续修改 URL、Headers、Body
- [ ] 验证只在最后一次修改后 500ms 触发一次保存

#### 场景 4: Cmd+S 快捷键
- [ ] 打开已保存请求并修改
- [ ] 立即按 Cmd+S
- [ ] 验证立即触发保存（不等待 500ms）

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 误判请求状态 | 严格检查 `currentRequest?.id`，添加日志 |
| 防抖逻辑错误 | 详细单元测试；性能监控 |
| Monaco Editor 事件冲突 | 确保事件监听在编辑器初始化后绑定 |

---

## 时间估算

| 阶段 | 任务 | 估算时间 |
|------|------|----------|
| Phase 0 | 技术研究 | 已完成 |
| Phase 1 | 数据模型与契约 | 已完成 |
| Phase 2.1 | Extension 命令层 | 0.5h |
| Phase 2.2 | Webview UI 实现 | 2-3h |
| Phase 2.3 | 测试与优化 | 0.5-1h |
| **总计** | | **3-4.5h** |

**对比原计划**：从 7-9h 减少到 3-4.5h，节省 50% 时间！

---

## 下一步行动

1. ✅ 完成 Phase 0 和 Phase 1（本文档已完成）
2. ⏭️ 运行 `/speckit.implement` 开始实施
3. ⏭️ 按 Phase 2.1 → 2.2 → 2.3 顺序执行
4. ⏭️ 每个阶段完成后提交代码

---

## 附录

### A. 关键代码位置
- `src/extension.ts` - 新增 `httpClient.autoSaveRequest` 命令
- `src/HttpClientPanel.ts` - Webview UI 实现（监听、防抖、状态指示器）

### B. 核心判断逻辑

**最重要的一行代码**:
```typescript
if (currentRequest?.id) {
  debouncedAutoSave();  // 只对已保存请求自动保存
}
```

这一行代码确保了：
- ✅ 简单明了，易于理解和维护
- ✅ 不修改数据模型，完全向后兼容
- ✅ 不需要草稿功能，减少 50% 复杂度
