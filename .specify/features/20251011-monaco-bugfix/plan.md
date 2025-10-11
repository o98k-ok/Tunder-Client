# Monaco Editor Bug 修复 - 实施计划

## 计划概要
- **Feature**: Monaco Editor Bug 修复
- **Priority**: 🔴 CRITICAL
- **Total Effort**: 1-2 hours
- **Target Version**: v0.2.1 (Hotfix)

---

## Technical Context

### Known Issues
1. **Bug #1**: 点击 Body 后发送请求无结果
   - **Root Cause**: `bodyEditor` 变量在事件监听器绑定时为 null（异步加载问题）
   - **Impact**: 核心功能不可用
   
2. **Bug #2**: 缺少实时格式化
   - **Root Cause**: 只配置了粘贴和失焦格式化，未启用 `formatOnType`
   - **Impact**: 用户体验不佳

### Technology Stack
- Monaco Editor
- VSCode Webview
- TypeScript
- Async module loading (require.js)

### Architecture Constraints
- Monaco Editor 通过 require.js 异步加载
- Webview 中的事件监听器可能在 Monaco 加载前绑定
- 需要确保所有依赖 `bodyEditor` 的代码在其初始化后执行

---

## Constitution Check

### ✅ 合规性检查

#### 原则 1: 接口文档完整性
- ✅ 查阅了 Monaco Editor API 文档
- ✅ 了解 `formatOnType` 配置项
- ✅ 了解异步加载机制

#### 原则 2: 执行明确性
- ✅ 问题明确：两个具体的 bug
- ✅ 解决方案明确：事件绑定顺序 + formatOnType

#### 原则 5: 测试规范
- ✅ 包含具体测试用例
- ✅ 有验收标准

#### 原则 8: 重构谨慎
- ✅ 最小化修改：只改动问题相关代码
- ✅ 保留原有逻辑：不重写整个初始化流程

---

## Gates

### Pre-implementation Gates
- [x] ✅ Spec reviewed and approved
- [x] ✅ Root cause identified
- [x] ✅ Solution validated through research
- [ ] ⏳ Test environment ready

### Post-implementation Gates
- [ ] All tests pass
- [ ] No regression in existing features
- [ ] Performance acceptable
- [ ] Code reviewed

---

## Phase 0: Research & Analysis (15 min)

### Research Tasks

#### R0.1: Monaco Editor 异步加载机制
**Question**: 如何确保代码在 Monaco 加载完成后执行？

**Research**:
- Monaco 使用 require.js AMD 模块加载器
- `require(['vs/editor/editor.main'], callback)` 是异步的
- 回调函数在 Monaco 加载完成后执行

**Decision**: 
- ✅ 将所有依赖 `bodyEditor` 的代码移到 require 回调内
- ✅ 或使用 Promise/Flag 确保初始化顺序

**Rationale**: 确保 `bodyEditor` 在使用前已创建

---

#### R0.2: Monaco formatOnType 配置
**Question**: `formatOnType` 如何工作？会影响性能吗？

**Research**:
- `formatOnType: true` 启用输入时自动格式化
- 只在特定字符后触发（如 `;`, `}`, 换行等）
- Monaco 内部已优化，不会每个字符都格式化
- 对 JSON 支持良好

**Decision**: 
- ✅ 使用 `formatOnType: true`
- ✅ 保留 `formatOnPaste` 和失焦格式化作为补充

**Rationale**: 
- 内置功能，稳定可靠
- 性能已优化
- 满足"实时格式化"需求

---

#### R0.3: 事件监听器最佳实践
**Question**: 如何组织 Webview 中的事件监听器？

**Best Practice**:
```javascript
// 模式 1: 所有事件监听器在 Monaco 回调内
require(['vs/editor/editor.main'], function() {
    bodyEditor = monaco.editor.create(...);
    bindAllEvents(); // ✅ 确保 bodyEditor 可用
});

// 模式 2: 使用 Promise
let editorReadyPromise = new Promise(resolve => {
    require(['vs/editor/editor.main'], function() {
        bodyEditor = monaco.editor.create(...);
        resolve();
    });
});

// 使用时
editorReadyPromise.then(() => {
    // 可以安全使用 bodyEditor
});
```

**Decision**: 使用模式 1 - 简单直接

---

### Research Output

**文档**: `research.md`

**关键发现**:
1. Monaco 异步加载需要回调确保初始化顺序
2. `formatOnType` 是实时格式化的标准方案
3. 事件监听器应在 Monaco 初始化后绑定

---

## Phase 1: Design & Contracts (10 min)

### Data Model

#### 实体: EditorState
```typescript
interface EditorState {
  instance: monaco.editor.IStandaloneCodeEditor | null;
  ready: boolean;
  content: string;
  language: string;
}
```

**说明**: 无需新的数据模型，只需确保现有的 `bodyEditor` 正确管理

---

### API Changes

#### 修改前
```javascript
// ❌ 问题：bodyEditor 可能为 null
document.getElementById('sendBtn').addEventListener('click', () => {
    const body = bodyEditor ? bodyEditor.getValue() : '';
    // ...
});
```

#### 修改后
```javascript
// ✅ 解决：在 Monaco 初始化后绑定
require(['vs/editor/editor.main'], function() {
    bodyEditor = monaco.editor.create(...);
    
    // 所有依赖 bodyEditor 的事件监听器
    document.getElementById('sendBtn').addEventListener('click', () => {
        const body = bodyEditor.getValue(); // 安全调用
        // ...
    });
});
```

---

### Configuration Changes

#### Monaco Editor 配置

**修改前**:
```javascript
{
    formatOnType: false,  // ❌ 默认关闭
    formatOnPaste: false
}
```

**修改后**:
```javascript
{
    formatOnType: true,   // ✅ 启用实时格式化
    formatOnPaste: true   // ✅ 启用粘贴格式化
}
```

---

## Phase 2: Implementation Plan (45 min)

### Milestone 1: 修复 Bug #1 - 发送请求无结果 (30 min)

#### Task 1.1: 添加诊断日志 (5 min)
```javascript
// 在 Monaco 初始化处
require(['vs/editor/editor.main'], function() {
    console.log('[Monaco] Loading complete');
    bodyEditor = monaco.editor.create(...);
    console.log('[Monaco] Editor created:', bodyEditor);
});

// 在 Send 按钮处
document.getElementById('sendBtn').addEventListener('click', () => {
    console.log('[Send] Button clicked');
    console.log('[Send] bodyEditor:', bodyEditor);
    const body = bodyEditor ? bodyEditor.getValue() : '';
    console.log('[Send] Body content:', body);
});
```

**Acceptance**: 可以从控制台追踪初始化和发送流程

---

#### Task 1.2: 重构事件监听器结构 (20 min)

**目标**: 将所有依赖 `bodyEditor` 的代码移到 Monaco 初始化回调内

**实施步骤**:

1. **识别依赖 `bodyEditor` 的代码**:
   - ✅ Send 按钮点击事件
   - ✅ Headers 变化监听（用于语言检测）
   - ✅ 可能的其他引用

2. **创建函数封装**:
```javascript
function bindEditorDependentEvents() {
    // Send 按钮
    document.getElementById('sendBtn').addEventListener('click', () => {
        const body = bodyEditor.getValue();
        // ...
    });
    
    // 其他依赖 bodyEditor 的事件
}
```

3. **在 Monaco 回调中调用**:
```javascript
require(['vs/editor/editor.main'], function() {
    bodyEditor = monaco.editor.create(...);
    
    // 配置自动格式化
    bodyEditor.onDidPaste(...);
    bodyEditor.onDidBlurEditorText(...);
    
    // 绑定依赖 bodyEditor 的事件
    bindEditorDependentEvents();
});
```

**Acceptance**: 
- [ ] 点击 Send 按钮后请求正常发送
- [ ] Response 正确显示

---

#### Task 1.3: 添加错误处理 (5 min)
```javascript
document.getElementById('sendBtn').addEventListener('click', () => {
    if (!bodyEditor) {
        console.error('[Send] Editor not initialized');
        vscode.postMessage({
            command: 'showError',
            message: 'Editor is still loading, please try again.'
        });
        return;
    }
    
    const body = bodyEditor.getValue();
    // ...
});
```

**Acceptance**: 如果编辑器未初始化，显示友好错误消息

---

### Milestone 2: 修复 Bug #2 - 实时格式化 (15 min)

#### Task 2.1: 启用 formatOnType (5 min)

**修改位置**: Monaco Editor 创建配置

```javascript
bodyEditor = monaco.editor.create(document.getElementById('body-editor'), {
    value: '',
    language: 'json',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: 'Consolas, Monaco, Courier New, monospace',
    wordWrap: 'on',
    formatOnPaste: true,   // ✅ 启用粘贴格式化
    formatOnType: true,    // ✅ 新增：启用输入格式化
    tabSize: 2,
    insertSpaces: true
});
```

**Acceptance**: 输入 `}` 或 `,` 后自动格式化

---

#### Task 2.2: 测试格式化体验 (10 min)

**测试用例**:
1. 输入 `{"name":"test","value":123}`
2. 观察是否自动格式化
3. 测试快速输入是否卡顿
4. 测试大 JSON 性能

**Acceptance**: 
- [ ] 格式化正常触发
- [ ] 无明显卡顿
- [ ] 光标位置正确

---

### Milestone 3: 回归测试 (10 min)

#### Task 3.1: 功能测试
- [ ] 发送 GET 请求
- [ ] 发送 POST 请求（带 Body）
- [ ] 粘贴 JSON 自动格式化
- [ ] 失焦自动格式化
- [ ] 语言自动检测
- [ ] Headers 功能
- [ ] Response 显示

#### Task 3.2: 性能测试
- [ ] 大 JSON (100KB+)
- [ ] 快速连续输入
- [ ] 多次发送请求

---

## Phase 3: Testing & Validation (10 min)

### Test Suite

#### Unit Tests (Future)
```typescript
describe('Monaco Editor Integration', () => {
    it('should initialize bodyEditor', () => {
        expect(bodyEditor).not.toBeNull();
    });
    
    it('should get body content', () => {
        bodyEditor.setValue('{"test": 123}');
        expect(bodyEditor.getValue()).toBe('{"test": 123}');
    });
});
```

### Manual Tests

#### Test Case 1: Bug #1 修复验证
**Steps**:
1. 启动调试 (F5)
2. 打开 HTTP Client
3. Body 输入: `{"name": "test"}`
4. URL: `https://jsonplaceholder.typicode.com/posts`
5. 点击 Send

**Expected**: ✅ 请求成功，响应显示

---

#### Test Case 2: Bug #2 修复验证
**Steps**:
1. Body 中慢速输入: `{"name":"test","value":123}`
2. 观察格式化

**Expected**: ✅ 输入过程中触发格式化

---

## Phase 4: Deployment (5 min)

### Checklist
- [ ] 所有测试通过
- [ ] 无新增 lint 错误
- [ ] 编译成功
- [ ] Git commit with clear message
- [ ] 更新 CHANGELOG.md
- [ ] 版本号 bump 到 v0.2.1

### Deployment Steps
```bash
# 1. 编译
npm run compile

# 2. 测试
# (手动测试)

# 3. 提交
git add src/HttpClientPanel.ts
git commit -m "fix: resolve Monaco Editor initialization and formatting issues

- Fix async loading issue causing send request failure
- Move event listeners inside Monaco callback to ensure initialization
- Enable formatOnType for real-time JSON formatting
- Add error handling for uninitialized editor

Fixes #1, #2"

# 4. 发布
git tag v0.2.1
git push origin feature/ui-refactor --tags
```

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| 事件绑定重构破坏其他功能 | 中 | 高 | 完整回归测试 |
| formatOnType 性能问题 | 低 | 中 | 性能测试，必要时禁用 |
| 初始化顺序仍有问题 | 低 | 高 | 添加详细日志，使用 Promise |

---

## Timeline

| Phase | Duration | Dependencies |
|-------|----------|--------------|
| Research | 15 min | None |
| Design | 10 min | Research |
| Implementation | 45 min | Design |
| Testing | 10 min | Implementation |
| Deployment | 5 min | Testing |
| **Total** | **1h 25min** | - |

---

## Success Criteria

### Must Have
- ✅ Bug #1 修复：发送请求正常工作
- ✅ Bug #2 修复：有实时格式化效果

### Should Have
- ✅ 无性能退化
- ✅ 所有现有功能正常

### Nice to Have
- ✅ 详细的日志帮助调试
- ✅ 友好的错误提示

---

## 附录: 代码修改清单

### 文件: `src/HttpClientPanel.ts`

#### 修改 1: Monaco 配置
**位置**: 约 line 655  
**修改**: 添加 `formatOnType: true`

#### 修改 2: 事件监听器结构
**位置**: 约 line 654-830  
**修改**: 将 Send 按钮等事件监听器移到 require 回调内

#### 修改 3: 错误处理
**位置**: Send 按钮处理函数  
**修改**: 添加 `bodyEditor` null 检查

---

**Plan Version**: 1.0.0  
**Status**: Ready for Implementation  
**Next Step**: `/speckit.implement`

