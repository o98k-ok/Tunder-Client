# Monaco Editor Bug 修复 - 功能规格

## 元数据
- **Feature ID**: monaco-editor-bugfix
- **Created**: 2025-10-11
- **Status**: Planning
- **Priority**: 🔴 CRITICAL
- **Estimated Effort**: 1-2 hours

---

## 1. 问题描述

### Bug #1: 点击 Body 后发送请求无结果 🔴 CRITICAL
**症状**: 点击 body 编辑器后，发送请求没有响应显示  
**影响**: 核心功能完全不可用  
**严重程度**: 高

### Bug #2: 缺少实时格式化 🟡 MEDIUM
**症状**: 输入 JSON 时有语法高亮，但没有实时格式化  
**影响**: 用户体验不佳，需要手动触发格式化  
**严重程度**: 中

---

## 2. 根本原因分析

### Bug #1 分析

**可能原因**:
1. ⚠️ **Monaco Editor 未正确初始化**: `bodyEditor` 为 null
2. ⚠️ **异步加载问题**: Monaco Editor 加载完成前点击发送按钮
3. ⚠️ **事件监听器时序**: Send 按钮绑定时 `bodyEditor` 还未创建
4. ⚠️ **getValue() 调用失败**: `bodyEditor.getValue()` 返回 undefined

**诊断步骤**:
```javascript
// 检查点 1: bodyEditor 是否初始化
console.log('bodyEditor:', bodyEditor);

// 检查点 2: getValue() 是否工作
console.log('body content:', bodyEditor ? bodyEditor.getValue() : 'null');

// 检查点 3: 请求是否真的发送了
console.log('Sending request with body:', body);
```

### Bug #2 分析

**问题**: 用户期望的是"边输入边格式化"（实时格式化），但当前只有：
- ✅ 粘贴时格式化
- ✅ 失焦时格式化
- ❌ **缺少**: 输入时实时格式化

**为什么没有实时格式化**:
1. 性能考虑：每次按键都格式化会导致光标跳动和性能问题
2. 用户体验：输入时格式化会干扰输入过程
3. 实现复杂度：需要保存光标位置、避免格式化循环

**解决方案选项**:
- **Option A**: 使用 `formatOnType: true`（Monaco 内置）
- **Option B**: 监听内容变化 + debounce 延迟格式化
- **Option C**: 特定触发条件（如输入 `}` 或 `]` 时）

---

## 3. 修复方案

### 修复 Bug #1: 发送请求无结果

#### 方案 1: 确保 Monaco Editor 初始化完成 ✅ 推荐

**问题**: `bodyEditor` 可能在 Send 按钮点击时还未初始化

**解决**:
```javascript
// 方法 1: 将事件监听器移到 Monaco 初始化回调内
require(['vs/editor/editor.main'], function() {
    bodyEditor = monaco.editor.create(...);
    
    // ✅ 在这里绑定发送按钮事件
    document.getElementById('sendBtn').addEventListener('click', () => {
        const body = bodyEditor ? bodyEditor.getValue() : '';
        // ...
    });
});
```

**方法 2**: 延迟绑定或使用 Promise
```javascript
let editorReady = false;

require(['vs/editor/editor.main'], function() {
    bodyEditor = monaco.editor.create(...);
    editorReady = true;
});

document.getElementById('sendBtn').addEventListener('click', () => {
    if (!editorReady) {
        alert('Editor is still loading...');
        return;
    }
    const body = bodyEditor.getValue();
    // ...
});
```

#### 方案 2: 添加详细日志诊断

```javascript
document.getElementById('sendBtn').addEventListener('click', () => {
    console.log('[DEBUG] Send button clicked');
    console.log('[DEBUG] bodyEditor:', bodyEditor);
    
    const body = bodyEditor ? bodyEditor.getValue() : '';
    console.log('[DEBUG] body content:', body);
    console.log('[DEBUG] body length:', body.length);
    
    // ... 发送请求
});
```

### 修复 Bug #2: 实时格式化

#### 方案 A: 启用 Monaco 内置 formatOnType ✅ 推荐

**最简单的解决方案**:
```javascript
bodyEditor = monaco.editor.create(document.getElementById('body-editor'), {
    // ... 其他配置
    formatOnType: true,  // ✅ 启用输入时格式化
    formatOnPaste: true  // ✅ 启用粘贴时格式化（已有但可以显式设置）
});
```

**优点**:
- ✅ Monaco 内置功能，稳定可靠
- ✅ 自动处理光标位置
- ✅ 性能优化
- ✅ 零额外代码

**缺点**:
- ⚠️ 只在特定触发条件下格式化（如输入 `;`, `}` 等）
- ⚠️ 不是每个字符都格式化

#### 方案 B: Debounced 实时格式化

**更激进的方案**:
```javascript
let formatTimer = null;

bodyEditor.onDidChangeModelContent(() => {
    // 清除之前的定时器
    if (formatTimer) clearTimeout(formatTimer);
    
    // 300ms 后格式化
    formatTimer = setTimeout(() => {
        if (bodyEditor.getModel().getLanguageId() === 'json') {
            try {
                JSON.parse(bodyEditor.getValue());
                bodyEditor.getAction('editor.action.formatDocument').run();
            } catch (e) {
                // 非法 JSON，不格式化
            }
        }
    }, 300);
});
```

**优点**:
- ✅ 更接近"实时"的体验
- ✅ 可以自定义延迟时间

**缺点**:
- ⚠️ 可能在输入未完成时格式化（导致错误）
- ⚠️ 性能开销较大
- ⚠️ 可能导致光标跳动

#### 方案 C: 混合方案（推荐）

```javascript
bodyEditor = monaco.editor.create(document.getElementById('body-editor'), {
    formatOnType: true,   // ✅ 启用基础实时格式化
    formatOnPaste: true,  // ✅ 粘贴时格式化
    // ...
});

// 保留失焦时格式化作为兜底
bodyEditor.onDidBlurEditorText(() => {
    // ... 现有逻辑
});
```

---

## 4. 实施计划

### Phase 1: 修复 Bug #1 (30分钟) 🔴 CRITICAL

#### Task 1.1: 添加诊断日志
- [ ] 在 Send 按钮点击处添加日志
- [ ] 在请求发送前添加日志
- [ ] 在 Monaco 初始化处添加日志
- **目的**: 确定问题根源

#### Task 1.2: 重构事件绑定顺序
- [ ] 将 Send 按钮事件监听器移到 Monaco 初始化回调内
- [ ] 确保 `bodyEditor` 在事件处理器中可用
- [ ] 添加 null 检查和错误提示
- **目的**: 确保初始化顺序正确

#### Task 1.3: 测试验证
- [ ] 启动调试模式
- [ ] 点击 Body 编辑器
- [ ] 输入内容
- [ ] 点击 Send 按钮
- [ ] 验证请求成功发送
- [ ] 验证响应正确显示

### Phase 2: 修复 Bug #2 (20分钟) 🟡 MEDIUM

#### Task 2.1: 启用 formatOnType
- [ ] 在 Monaco 配置中添加 `formatOnType: true`
- [ ] 测试输入体验
- **预期**: 输入 `}` 或 `,` 后自动格式化

#### Task 2.2: 优化格式化触发
- [ ] 保留粘贴时格式化
- [ ] 保留失焦时格式化
- [ ] 测试三种触发方式
- **预期**: 无论哪种方式都能正确格式化

#### Task 2.3: 性能测试
- [ ] 测试大 JSON (> 100KB)
- [ ] 测试快速输入
- [ ] 验证无卡顿
- **预期**: 流畅的输入体验

### Phase 3: 回归测试 (10分钟)

- [ ] 测试所有原有功能
- [ ] 测试 Headers 功能
- [ ] 测试 Response 显示
- [ ] 测试保存/加载请求
- **预期**: 所有功能正常

---

## 5. 验收标准

### Bug #1 修复验收
- [ ] 点击 Body 编辑器后，发送请求有响应
- [ ] 响应正确显示在 Response 区域
- [ ] 控制台无错误日志
- [ ] Body 内容正确发送到服务器

### Bug #2 修复验收
- [ ] 输入 JSON 时有实时格式化效果
- [ ] 输入流畅，无明显延迟
- [ ] 光标位置正确，不跳动
- [ ] 粘贴和失焦格式化仍然工作

---

## 6. 测试用例

### 测试用例 1: Bug #1 修复验证

**步骤**:
1. 启动调试 (F5)
2. 打开 HTTP Client
3. 在 Body 编辑器中输入：
```json
{
  "name": "test",
  "value": 123
}
```
4. 在 URL 输入框输入: `https://jsonplaceholder.typicode.com/posts`
5. 方法选择: POST
6. 点击 Send

**期望结果**:
- ✅ 请求发送成功
- ✅ Response 区域显示 201 状态码
- ✅ Response Body 显示创建的数据
- ✅ 控制台显示请求日志

### 测试用例 2: Bug #2 修复验证

**步骤**:
1. 在 Body 编辑器中慢速输入：
```
{"name":"test","value":123}
```
2. 观察格式化行为

**期望结果**:
- ✅ 输入过程中某些时刻触发格式化（如输入 `}` 后）
- ✅ 最终格式化为：
```json
{
  "name": "test",
  "value": 123
}
```

---

## 7. 风险评估

### 风险 1: 事件绑定顺序问题
**概率**: 高  
**影响**: 高  
**缓解**: 通过日志确认初始化顺序，使用 Promise 或回调确保顺序

### 风险 2: formatOnType 体验不佳
**概率**: 中  
**影响**: 中  
**缓解**: 如果不满意可以回退或使用 debounced 方案

### 风险 3: 破坏现有功能
**概率**: 低  
**影响**: 高  
**缓解**: 完整的回归测试

---

## 8. 回滚计划

如果修复导致新问题：
```bash
git checkout src/HttpClientPanel.ts
npm run compile
```

或使用上一个稳定的 commit：
```bash
git revert HEAD
```

---

## 附录 A: 诊断清单

在修复前，先确认以下信息：

```javascript
// 1. Monaco Editor 是否加载？
console.log('Monaco loaded:', typeof monaco !== 'undefined');

// 2. bodyEditor 是否创建？
console.log('bodyEditor:', bodyEditor);

// 3. Send 按钮是否存在？
console.log('Send button:', document.getElementById('sendBtn'));

// 4. getValue() 是否工作？
if (bodyEditor) {
    console.log('Body value:', bodyEditor.getValue());
}

// 5. 请求是否真的发送？
// 在 axios 调用处添加日志
```

---

**规格版本**: 1.0.0  
**优先级**: 🔴 CRITICAL  
**状态**: Ready for Implementation

