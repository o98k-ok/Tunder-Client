# 请求自动保存 - 技术研究报告

**Feature**: 请求实时自动保存  
**Created**: 2025-10-11  
**Status**: Completed

---

## 研究目标

为实时自动保存功能提供技术方案和最佳实践，确保：
1. 可靠的防抖机制
2. 高效的事件监听
3. 合理的数据存储策略
4. 良好的用户体验反馈

---

## R1: 防抖函数最佳实践

### 问题陈述
在 Webview 中实现可靠的防抖机制，避免频繁触发保存操作。

### 研究过程

#### 选项分析

| 方案 | 优点 | 缺点 | 决策 |
|------|------|------|------|
| **lodash.debounce** | 成熟稳定；功能完整 | 增加依赖体积；Webview 需额外引入 | ❌ |
| **自实现 debounce** | 无额外依赖；轻量 | 需要手动管理定时器 | ✅ **选择** |
| **RxJS debounceTime** | 强大的响应式编程 | 过度设计；学习成本高 | ❌ |

#### 推荐实现

```typescript
/**
 * 防抖函数：延迟执行，连续调用时重置计时器
 * @param func 要防抖的函数
 * @param delay 延迟时间（毫秒）
 * @returns 防抖后的函数
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | undefined;
  
  return function(this: any, ...args: Parameters<T>) {
    // 清除之前的定时器
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    // 设置新的定时器
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
```

#### 使用模式

```typescript
// 创建防抖保存函数
const debouncedAutoSave = debounce(() => {
  autoSave();
}, 500);

// 监听所有输入字段
document.getElementById('url')?.addEventListener('input', debouncedAutoSave);
document.getElementById('method')?.addEventListener('change', debouncedAutoSave);

// Monaco Editor
bodyEditor.onDidChangeModelContent(() => {
  debouncedAutoSave();
});
```

### 关键决策

**Q1: 所有输入字段共享一个防抖函数还是各自独立？**  
**A**: 共享一个防抖函数

**理由**:
- 用户可能连续修改多个字段（如先改 URL，再改 Headers）
- 共享防抖函数可确保最后一次修改后的 500ms 才保存
- 避免同时触发多次保存操作

**Q2: 防抖延迟设置为多少合适？**  
**A**: 500ms

**理由**:
- VSCode 自身的自动保存延迟为 1000ms
- Postman 的输入防抖约为 300-500ms
- 500ms 在用户体验（不过早触发）和数据安全（不过晚保存）之间达到最佳平衡

**Q3: 如何清理定时器？**  
**A**: 在页面卸载时清理

```typescript
// 保存定时器 ID 引用
let autoSaveTimerId: number | undefined;

// 页面卸载时清理
window.addEventListener('beforeunload', () => {
  if (autoSaveTimerId !== undefined) {
    clearTimeout(autoSaveTimerId);
  }
});
```

---

## R2: Monaco Editor 内容变化监听

### 问题陈述
如何高效监听 Monaco Editor 的内容变化，并触发自动保存？

### 研究过程

#### Monaco Editor 事件类型

| 事件 | 触发时机 | 是否适用 |
|------|----------|----------|
| `onDidChangeModelContent` | 每次内容变化（包括按键、粘贴、撤销） | ✅ **主要使用** |
| `onDidPaste` | 粘贴时 | ❌ 已被 `onDidChangeModelContent` 覆盖 |
| `onDidBlurEditorText` | 编辑器失焦时 | ❌ 不适合实时保存 |
| `onDidChangeModelDecorations` | 装饰变化时 | ❌ 不涉及内容 |

#### 推荐实现

```typescript
// 监听 Monaco Editor 内容变化
if (bodyEditor) {
  bodyEditor.onDidChangeModelContent((e) => {
    console.log('Monaco 内容变化:', e);
    
    // 使用防抖函数，避免每次按键都触发保存
    debouncedAutoSave();
  });
}
```

### 关键决策

**Q1: 是否需要过滤某些事件（如撤销/重做）？**  
**A**: 不需要

**理由**:
- 撤销/重做也会改变内容，应该保存
- `onDidChangeModelContent` 事件统一处理所有内容变化
- 防抖机制已过滤高频事件

**Q2: 是否需要检测内容是否真正改变？**  
**A**: 不需要在前端检测

**理由**:
- `onDidChangeModelContent` 只在内容真正改变时触发
- 后端保存逻辑会比较内容是否变化
- 前端过度检测会增加复杂度

---

## R3: 草稿请求的存储策略

### 问题陈述
草稿请求如何与正式请求区分存储？

### 研究过程

#### 选项分析

| 方案 | 数据结构 | 优点 | 缺点 | 决策 |
|------|----------|------|------|------|
| **A: 添加 is_draft 字段** | `{ id, name, is_draft: true }` | 简单；易查询 | 混合存储 | ✅ **选择** |
| **B: 单独 drafts.json** | 两个文件 | 隔离清晰 | 管理复杂；目录树需查询两个源 | ❌ |
| **C: name 前缀** | `{ name: "[Draft] xxx" }` | 无需新字段 | 字符串处理繁琐；不易过滤 | ❌ |
| **D: 特殊 folder_id** | `{ folder_id: "__drafts__" }` | 利用现有结构 | 草稿文件夹概念混乱 | ❌ |

#### 推荐方案：选项 A

**数据模型**:
```typescript
export interface Request {
    id: string;
    name: string;
    folder_id: string;
    url: string;
    method: string;
    headers?: Array<{ key: string; value: string }>;
    body?: string;
    created_at: number;
    updated_at: number;
    is_draft: boolean;  // 新增字段
}
```

**存储示例** (`requests.json`):
```json
[
  {
    "id": "req-001",
    "name": "Get Users",
    "is_draft": false,
    "url": "https://api.example.com/users",
    "method": "GET",
    "folder_id": "folder-001",
    "created_at": 1697000000000,
    "updated_at": 1697000000000
  },
  {
    "id": "draft-001",
    "name": "",
    "is_draft": true,
    "url": "https://api.example.com/products",
    "method": "POST",
    "folder_id": "folder-001",
    "created_at": 1697000010000,
    "updated_at": 1697000010000
  }
]
```

### 关键决策

**Q1: 草稿是否需要名称？**  
**A**: 不强制要求，可为空字符串

**理由**:
- 草稿是临时性的，用户可能不想命名
- 目录树可显示 URL 作为标识（如 `[草稿] POST /products`）
- 转为正式请求时再要求输入名称

**Q2: 草稿的 ID 格式？**  
**A**: 使用 `draft-{timestamp}` 格式

**理由**:
- 便于识别草稿
- 转为正式请求时生成新 ID（`req-{timestamp}`）
- 避免 ID 冲突

**Q3: 数据迁移如何处理？**  
**A**: 现有请求默认 `is_draft: false`

```typescript
private loadRequests() {
    try {
        if (fs.existsSync(this.storageFile)) {
            const data = JSON.parse(fs.readFileSync(this.storageFile, 'utf8')) as Request[];
            data.forEach(request => {
                // 向后兼容：现有请求默认不是草稿
                if (request.is_draft === undefined) {
                    request.is_draft = false;
                }
                this.requests.set(request.id, request);
            });
        }
    } catch (error) {
        console.error('加载请求失败:', error);
    }
}
```

---

## R4: 保存状态指示器的 UI 实现

### 问题陈述
如何设计清晰、不干扰用户的保存状态反馈？

### 研究过程

#### 位置选项分析

| 位置 | 用户体验 | 实现难度 | 决策 |
|------|----------|----------|------|
| **A: 请求名称旁边** | 视线聚焦区域；易注意 | 简单 | ✅ **选择** |
| **B: 右上角独立区域** | 不干扰输入；专业 | 中等 | ✅ 备选 |
| **C: 底部状态栏** | 类似 VSCode | 需要新增状态栏 | ❌ |
| **D: 浮动 Toast** | 显眼 | 过于干扰；不适合频繁更新 | ❌ |

#### 推荐方案：位置 A（请求名称旁边）

**HTML 结构**:
```html
<div class="request-header">
  <input 
    type="text" 
    id="request-name" 
    placeholder="Untitled Request"
    class="request-name-input"
  >
  <div class="save-indicator" id="save-indicator">
    <span class="icon"></span>
    <span class="text">已保存</span>
  </div>
</div>
```

**CSS 样式**:
```css
.request-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  border-bottom: 1px solid var(--vscode-panel-border);
}

.request-name-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--vscode-foreground);
  font-size: 14px;
  font-weight: 500;
  outline: none;
}

.request-name-input::placeholder {
  color: var(--vscode-input-placeholderForeground);
}

.save-indicator {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.2s ease;
}

/* 状态样式 */
.save-indicator.saved {
  color: var(--vscode-testing-iconPassed);
  background: var(--vscode-inputValidation-infoBorder);
}

.save-indicator.saved .icon::before {
  content: '✓';
}

.save-indicator.saving {
  color: var(--vscode-testing-iconQueued);
  background: var(--vscode-inputValidation-warningBorder);
}

.save-indicator.saving .icon::before {
  content: '⏳';
}

.save-indicator.unsaved {
  color: var(--vscode-descriptionForeground);
  background: var(--vscode-editor-background);
  border: 1px solid var(--vscode-panel-border);
}

.save-indicator.unsaved .icon::before {
  content: '●';
}

.save-indicator.error {
  color: var(--vscode-testing-iconFailed);
  background: var(--vscode-inputValidation-errorBorder);
}

.save-indicator.error .icon::before {
  content: '✗';
}
```

**JavaScript 更新逻辑**:
```typescript
function updateSaveIndicator(
  status: 'saved' | 'saving' | 'unsaved' | 'error',
  message?: string
) {
  const indicator = document.getElementById('save-indicator');
  if (!indicator) return;

  // 移除所有状态类
  indicator.classList.remove('saved', 'saving', 'unsaved', 'error');
  
  // 添加当前状态类
  indicator.classList.add(status);

  // 更新文本
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

### 关键决策

**Q1: 状态指示器何时显示/隐藏？**  
**A**: 始终显示

**理由**:
- 用户需要持续感知保存状态
- 隐藏/显示会产生布局抖动
- 静默保存时显示"已保存"，不打断用户

**Q2: 是否需要动画效果？**  
**A**: 需要平滑过渡动画

**理由**:
- 状态变化时的平滑过渡提升用户体验
- 避免突兀的颜色切换
- 使用 CSS `transition` 实现

**Q3: 错误状态如何处理？**  
**A**: 显示错误消息，提供重试机制

```typescript
// 监听保存状态消息
window.addEventListener('message', (event) => {
  const message = event.data;
  
  if (message.command === 'updateSaveStatus') {
    updateSaveIndicator(message.status, message.message);
    
    // 如果保存失败，提供重试按钮
    if (message.status === 'error') {
      vscode.postMessage({
        type: 'showErrorWithRetry',
        message: message.message || '保存失败',
        action: 'retrySave'
      });
    }
  }
});
```

---

## R5: 性能优化策略

### 问题陈述
如何确保自动保存不影响 UI 性能？

### 研究成果

#### 性能优化要点

1. **异步保存**
   - 保存操作使用 `async/await`
   - 不阻塞 UI 线程
   ```typescript
   async function autoSave() {
     updateSaveIndicator('saving');
     try {
       const result = await vscode.postMessage({
         command: 'autoSaveRequest',
         data: collectRequestData(),
         silent: true
       });
       updateSaveIndicator('saved');
     } catch (error) {
       updateSaveIndicator('error', error.message);
     }
   }
   ```

2. **数据收集优化**
   - 只收集必要的字段
   - 避免深度克隆大对象
   ```typescript
   function collectRequestData() {
     return {
       id: currentRequest?.id,
       name: (document.getElementById('request-name') as HTMLInputElement)?.value || '',
       url: (document.getElementById('url') as HTMLInputElement)?.value || '',
       method: (document.getElementById('method') as HTMLSelectElement)?.value || 'GET',
       headers: getHeadersArray(),  // 只收集非空 headers
       body: bodyEditor?.getValue() || '',
       folder_id: currentFolderId,
       is_draft: currentRequest?.is_draft ?? true
     };
   }
   ```

3. **事件委托**
   - Headers 表格使用事件委托，避免为每个输入框绑定事件
   ```typescript
   document.getElementById('headers-table')?.addEventListener('input', (e) => {
     if ((e.target as HTMLElement).classList.contains('header-input')) {
       debouncedAutoSave();
     }
   });
   ```

4. **内存管理**
   - 清理定时器
   - 避免闭包泄漏
   ```typescript
   let autoSaveTimerId: number | undefined;
   
   function cleanup() {
     if (autoSaveTimerId !== undefined) {
       clearTimeout(autoSaveTimerId);
       autoSaveTimerId = undefined;
     }
   }
   
   window.addEventListener('beforeunload', cleanup);
   ```

---

## 总结与建议

### 技术选型总结

| 技术点 | 推荐方案 | 理由 |
|--------|----------|------|
| 防抖函数 | 自实现，500ms 延迟 | 轻量；无依赖；符合行业标准 |
| Monaco 监听 | `onDidChangeModelContent` | 统一处理所有内容变化 |
| 草稿存储 | `is_draft: boolean` 字段 | 简单；易查询；向后兼容 |
| 状态指示器 | 请求名称旁边 | 视线聚焦；不干扰 |
| 性能优化 | 异步保存 + 事件委托 | 不阻塞 UI；高效 |

### 风险与建议

| 风险 | 建议 |
|------|------|
| 防抖逻辑错误 | 详细单元测试；添加日志监控 |
| Monaco 事件冲突 | 确保事件监听在编辑器初始化后绑定 |
| 保存失败数据丢失 | 添加本地缓存（localStorage）作为备份 |
| 用户不习惯 | 提供配置项控制自动保存（未来扩展） |

### 下一步行动

1. ✅ 研究完成，技术方案已明确
2. ⏭️ 进入 Phase 1：数据模型与契约设计
3. ⏭️ 进入 Phase 2：分阶段实施（数据层 → Extension → Webview）

