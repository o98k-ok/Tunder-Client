# 快速入门 - 请求自动保存开发指南

**Feature**: 请求实时自动保存  
**Audience**: 开发者  
**Last Updated**: 2025-10-11

---

## 概述

本指南帮助开发者快速理解和实施请求自动保存功能，包括环境设置、关键代码位置、调试技巧和测试方法。

---

## 1. 开发环境设置

### 1.1 前置条件

- **Node.js**: >= 14.x
- **VSCode**: >= 1.60.0
- **TypeScript**: >= 4.0.0

### 1.2 项目结构

```
Tunder-Client/
├── src/
│   ├── models/
│   │   └── request.ts           # Request 接口定义
│   ├── services/
│   │   ├── requestService.ts    # 请求 CRUD 逻辑
│   │   └── directoryService.ts  # 文件夹管理
│   ├── views/
│   │   └── DirectoryTreeProvider.ts  # 目录树视图
│   ├── extension.ts             # Extension 主入口
│   └── HttpClientPanel.ts       # Webview 面板
├── .specify/
│   └── features/
│       └── 20251011-request-save-refactor/
│           ├── spec.md          # 功能规格
│           ├── plan.md          # 实施计划
│           └── design/          # 设计文档
└── package.json
```

### 1.3 安装依赖

```bash
npm install
```

### 1.4 编译项目

```bash
npm run compile
```

### 1.5 启动调试

1. 在 VSCode 中打开项目
2. 按 `F5` 启动 Extension Development Host
3. 在新窗口中运行命令: `Tunder HTTP Client: Start`

---

## 2. 关键代码位置

### 2.1 数据模型层

**文件**: `src/models/request.ts`

**修改点**: 添加 `is_draft` 字段

```typescript
export interface Request {
    // ... 现有字段
    is_draft: boolean;  // 新增
}
```

---

### 2.2 服务层

**文件**: `src/services/requestService.ts`

**新增方法**:
- `createDraft(data: Partial<Request>): Request | null`
- `promoteDraftToRequest(draftId: string, name: string): Request | null`
- `autoSave(requestData: Partial<Request>): { success: boolean; request?: Request; error?: string }`
- `getAllDrafts(): Request[]`

**修改方法**:
- `loadRequests()`: 添加数据迁移逻辑

**关键代码**:
```typescript
// 数据迁移
private loadRequests() {
    // ...
    data.forEach(request => {
        if (request.is_draft === undefined) {
            request.is_draft = false;  // 向后兼容
        }
        this.requests.set(request.id, request);
    });
}

// 自动保存
autoSave(requestData: Partial<Request>) {
    if (requestData.id) {
        // 更新现有请求
        return this.updateRequest(requestData.id, requestData);
    } else {
        // 创建草稿
        const draft = this.createDraft(requestData);
        return { success: !!draft, request: draft };
    }
}
```

---

### 2.3 Extension 命令层

**文件**: `src/extension.ts`

**新增命令**:
```typescript
context.subscriptions.push(
  vscode.commands.registerCommand(
    'httpClient.autoSaveRequest',
    async (requestData: any) => {
      const result = requestService.autoSave(requestData);
      
      // 返回保存状态
      HttpClientPanel.currentPanel?.postMessage({
        command: 'updateSaveStatus',
        status: result.success ? 'saved' : 'error',
        message: result.error,
        request_id: result.request?.id
      });
      
      // 刷新目录树
      if (result.success) {
        directoryTreeProvider.refresh();
      }
    }
  )
);
```

**修改命令**:
- `httpClient.saveRequest`: 改为"另存为"功能（可选）

---

### 2.4 Webview 面板层

**文件**: `src/HttpClientPanel.ts`

**关键实现**:

1. **防抖函数**:
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
```

2. **自动保存函数**:
```typescript
function autoSave() {
  const requestData = {
    id: currentRequest?.id,
    name: document.getElementById('request-name')?.value || '',
    url: document.getElementById('url')?.value || '',
    method: document.getElementById('method')?.value || 'GET',
    headers: getHeadersArray(),
    body: bodyEditor?.getValue() || '',
    folder_id: currentFolderId,
    is_draft: currentRequest?.is_draft ?? true
  };
  
  vscode.postMessage({
    command: 'autoSaveRequest',
    data: requestData,
    silent: true
  });
  
  updateSaveIndicator('saving');
}

const debouncedAutoSave = debounce(autoSave, 500);
```

3. **监听输入变化**:
```typescript
// URL 输入
document.getElementById('url')?.addEventListener('input', debouncedAutoSave);

// Method 选择
document.getElementById('method')?.addEventListener('change', debouncedAutoSave);

// Headers 表格（事件委托）
document.getElementById('headers-table')?.addEventListener('input', (e) => {
  if ((e.target as HTMLElement).classList.contains('header-input')) {
    debouncedAutoSave();
  }
});

// Monaco Editor
if (bodyEditor) {
  bodyEditor.onDidChangeModelContent(() => {
    debouncedAutoSave();
  });
}
```

4. **保存状态指示器**:
```typescript
function updateSaveIndicator(
  status: 'saved' | 'saving' | 'unsaved' | 'error',
  message?: string
) {
  const indicator = document.getElementById('save-indicator');
  if (!indicator) return;

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

5. **处理保存状态消息**:
```typescript
case 'updateSaveStatus':
    updateSaveIndicator(message.status, message.message);
    
    // 如果是新创建的草稿，保存 ID
    if (message.request_id && !currentRequest) {
        currentRequest = {
            id: message.request_id,
            is_draft: true
        };
    }
    break;
```

---

## 3. 调试技巧

### 3.1 启用日志

**Extension 端**:
```typescript
console.log('[AutoSave] 开始保存:', requestData);
console.log('[AutoSave] 保存结果:', result);
```

**Webview 端**:
```typescript
console.log('[Webview] 触发自动保存');
console.log('[Webview] 收集的数据:', requestData);
console.log('[Webview] 保存状态更新:', status);
```

### 3.2 查看存储文件

**Mac/Linux**:
```bash
cat ~/Library/Application\ Support/Code/User/globalStorage/<publisher>.<extension>/requests.json
```

**Windows**:
```cmd
type %APPDATA%\Code\User\globalStorage\<publisher>.<extension>\requests.json
```

### 3.3 使用 VSCode 开发者工具

1. 在 Extension Development Host 中按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)
2. 运行命令: `Developer: Open Webview Developer Tools`
3. 查看 Console、Network、Elements 标签

### 3.4 断点调试

**Extension 代码**:
- 在 `src/extension.ts` 或 `src/services/requestService.ts` 中设置断点
- 按 `F5` 启动调试
- 触发相关操作

**Webview 代码**:
- 打开 Webview Developer Tools
- 在 Sources 标签中找到内联脚本
- 设置断点并触发操作

---

## 4. 测试方法

### 4.1 手动测试清单

#### 场景 1: 创建草稿
- [ ] 打开空白面板
- [ ] 输入 URL
- [ ] 等待 500ms
- [ ] 验证左侧目录树出现草稿请求
- [ ] 验证保存状态指示器显示"已保存"

#### 场景 2: 更新草稿
- [ ] 继续修改 Headers
- [ ] 等待 500ms
- [ ] 验证草稿已更新（检查 `requests.json` 的 `updated_at`）
- [ ] 验证目录树中只有一个草稿

#### 场景 3: 草稿转正式请求
- [ ] 点击"保存为正式请求"按钮
- [ ] 输入请求名称
- [ ] 验证目录树中草稿消失，正式请求出现
- [ ] 验证 `requests.json` 中 `is_draft: false`

#### 场景 4: 更新正式请求
- [ ] 修改正式请求的 Body
- [ ] 等待 500ms
- [ ] 验证请求已自动更新
- [ ] 验证保存状态指示器正常

#### 场景 5: 防抖测试
- [ ] 快速连续输入 URL
- [ ] 验证只在最后一次输入后 500ms 触发保存
- [ ] 检查日志，确认只有一次保存操作

#### 场景 6: 错误处理
- [ ] 模拟保存失败（如文件权限错误）
- [ ] 验证保存状态指示器显示"保存失败"
- [ ] 验证错误提示清晰

### 4.2 单元测试示例

**文件**: `src/test/suite/requestService.test.ts`

```typescript
import * as assert from 'assert';
import { RequestService } from '../../services/requestService';

suite('RequestService Auto-save Tests', () => {
  let requestService: RequestService;

  setup(() => {
    // 初始化 requestService
  });

  test('createDraft 应创建草稿请求', () => {
    const draft = requestService.createDraft({
      url: 'https://api.example.com',
      method: 'GET'
    });

    assert.ok(draft);
    assert.strictEqual(draft.is_draft, true);
    assert.ok(draft.id.startsWith('draft-'));
  });

  test('autoSave 应正确处理创建和更新', () => {
    // 测试创建
    const result1 = requestService.autoSave({
      url: 'https://api.example.com'
    });
    assert.strictEqual(result1.success, true);
    assert.strictEqual(result1.request?.is_draft, true);

    // 测试更新
    const result2 = requestService.autoSave({
      id: result1.request!.id,
      url: 'https://api.example.com/updated'
    });
    assert.strictEqual(result2.success, true);
    assert.strictEqual(result2.request?.url, 'https://api.example.com/updated');
  });

  test('promoteDraftToRequest 应将草稿转为正式请求', () => {
    const draft = requestService.createDraft({ url: 'test' });
    const request = requestService.promoteDraftToRequest(draft!.id, 'Test Request');

    assert.ok(request);
    assert.strictEqual(request.is_draft, false);
    assert.strictEqual(request.name, 'Test Request');
    assert.ok(request.id.startsWith('req-'));
  });
});
```

**运行测试**:
```bash
npm test
```

---

## 5. 常见问题 (FAQ)

### Q1: 防抖不生效，每次输入都触发保存？

**原因**: 可能是每次都创建了新的防抖函数

**解决**:
```typescript
// ❌ 错误：每次都创建新函数
document.getElementById('url')?.addEventListener('input', () => {
  debounce(autoSave, 500)();
});

// ✅ 正确：复用同一个防抖函数
const debouncedAutoSave = debounce(autoSave, 500);
document.getElementById('url')?.addEventListener('input', debouncedAutoSave);
```

---

### Q2: Monaco Editor 内容变化不触发自动保存？

**原因**: `bodyEditor` 可能未初始化或事件监听绑定时机错误

**解决**:
```typescript
// 确保在 Monaco Editor 初始化后绑定事件
require(['vs/editor/editor.main'], function() {
  bodyEditor = monaco.editor.create(/* ... */);
  
  // 在这里绑定事件
  bodyEditor.onDidChangeModelContent(() => {
    debouncedAutoSave();
  });
});
```

---

### Q3: 草稿请求在目录树中不显示？

**原因**: `DirectoryTreeProvider` 可能过滤了草稿

**解决**:
```typescript
// 确保 getChildren 方法返回草稿
getChildren(element?: DirectoryTreeItem): DirectoryTreeItem[] {
  // ...
  const requests = requestService.getAllRequests();  // 包括草稿
  return requests.map(req => new DirectoryTreeItem(req));
}
```

---

### Q4: 保存状态指示器不更新？

**原因**: 消息监听未正确处理或 DOM 元素未找到

**解决**:
```typescript
// 检查消息监听
window.addEventListener('message', (event) => {
  const message = event.data;
  console.log('收到消息:', message);  // 调试日志
  
  if (message.command === 'updateSaveStatus') {
    updateSaveIndicator(message.status, message.message);
  }
});

// 检查 DOM 元素
const indicator = document.getElementById('save-indicator');
console.log('指示器元素:', indicator);  // 应该不为 null
```

---

## 6. 性能优化建议

### 6.1 减少不必要的保存

```typescript
// 记录上次保存的数据，避免重复保存相同内容
let lastSavedData: string | null = null;

function autoSave() {
  const requestData = collectRequestData();
  const currentData = JSON.stringify(requestData);
  
  if (currentData === lastSavedData) {
    console.log('[AutoSave] 数据未变化，跳过保存');
    return;
  }
  
  lastSavedData = currentData;
  
  // 执行保存
  vscode.postMessage({ command: 'autoSaveRequest', data: requestData });
}
```

### 6.2 异步保存

```typescript
// Extension 端使用异步保存
context.subscriptions.push(
  vscode.commands.registerCommand(
    'httpClient.autoSaveRequest',
    async (requestData: any) => {  // 使用 async
      try {
        const result = await requestService.autoSaveAsync(requestData);
        // ...
      } catch (error) {
        // 错误处理
      }
    }
  )
);
```

---

## 7. 下一步

完成本地开发和测试后：

1. ✅ 运行 `npm run compile` 编译代码
2. ✅ 运行 `npm test` 执行单元测试
3. ✅ 手动测试所有用户场景
4. ✅ 提交代码: `git commit -m "feat: auto-save requests with draft support"`
5. ✅ 创建 Pull Request 并等待审查

---

## 8. 参考资源

- [VSCode Extension API](https://code.visualstudio.com/api)
- [Webview API Guide](https://code.visualstudio.com/api/extension-guides/webview)
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [JavaScript Debounce Pattern](https://davidwalsh.name/javascript-debounce-function)
- [项目 Constitution](./../../../.specify/memory/constitution.md)

---

**祝开发顺利！如有问题，请参考本文档或联系团队成员。** 🚀

