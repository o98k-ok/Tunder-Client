# Body 输入框重构 - 功能规格

## 元数据
- **Feature ID**: body-editor-refactor
- **Created**: 2025-10-11
- **Status**: Planning
- **Priority**: Medium
- **Estimated Effort**: 4-6 hours

---

## 1. 概述

### 1.1 功能描述
对当前的请求 body 输入框进行全面重构，从简单的 `<textarea>` 升级为专业的代码编辑器，支持 JSON 自动格式化和语法高亮，提升用户体验至 IDE 级别。

### 1.2 业务价值
- **提升效率**: 自动格式化减少手动操作
- **减少错误**: 语法高亮和错误提示帮助及时发现问题
- **专业体验**: 与 VSCode 环境无缝融合
- **降低学习成本**: 移除 Beautify 按钮，自动化处理

### 1.3 用户场景
1. **JSON API 测试**: 开发者需要频繁编辑和测试 JSON 请求体
2. **从文档复制**: 从 API 文档复制 JSON 示例后自动格式化
3. **调试 API**: 需要清晰查看请求体结构
4. **多语言支持**: 可能需要发送 XML、Plain Text 等格式

---

## 2. 技术方案

### 2.1 编辑器选型

**选择**: **Monaco Editor** (VSCode 内置编辑器)

**理由**:
1. ✅ VSCode 原生集成，无需额外体积
2. ✅ 完整的语法高亮、错误提示、自动补全
3. ✅ 支持 JSON Schema 验证
4. ✅ 与 VSCode 主题自动同步
5. ✅ 成熟稳定，被 VSCode 自身使用

**替代方案对比**:
| 方案 | 优点 | 缺点 | 选择 |
|------|------|------|------|
| Monaco Editor | VSCode 原生；功能完整 | 需要正确配置 Webview | ✅ **选择** |
| CodeMirror 6 | 轻量；现代 | 额外依赖；风格不一致 | ❌ |
| 简单高亮 | 无依赖 | 功能弱；体验差 | ❌ |

### 2.2 自动格式化策略

**触发时机** (Option D - 组合方式):
1. **粘贴时**: 检测到 `paste` 事件，立即格式化
2. **失焦时**: 检测到 `blur` 事件 + 内容变化，自动格式化

**格式化规则**:
```json
{
  "indent": 2,           // 2 空格缩进
  "insertSpaces": true,  // 使用空格而非 Tab
  "trimTrailingWhitespace": true,
  "insertFinalNewline": false
}
```

**实现伪码**:
```typescript
// 粘贴时格式化
editor.onDidPaste(() => {
  if (canFormatAsJSON()) {
    formatDocument();
  }
});

// 失焦时格式化
editor.onDidBlurEditorText(() => {
  if (contentChanged && canFormatAsJSON()) {
    formatDocument();
  }
});
```

### 2.3 语言检测

**策略**: Content-Type 优先 + 智能检测降级 (Option B+D)

**检测流程**:
```
1. 检查 Headers 中的 Content-Type
   ├─ application/json → JSON
   ├─ application/xml, text/xml → XML
   ├─ text/plain → Plain Text
   └─ text/html → HTML

2. 如果没有 Content-Type，智能检测:
   ├─ 尝试 JSON.parse() → JSON
   ├─ 检测 XML 标签 → XML
   └─ 其他 → Plain Text
```

**实现**:
```typescript
function detectLanguage(body: string, contentType?: string): string {
  // 1. Content-Type 优先
  if (contentType) {
    if (contentType.includes('json')) return 'json';
    if (contentType.includes('xml')) return 'xml';
    if (contentType.includes('html')) return 'html';
    return 'plaintext';
  }
  
  // 2. 智能检测
  try {
    JSON.parse(body);
    return 'json';
  } catch {
    if (body.trim().startsWith('<')) return 'xml';
    return 'plaintext';
  }
}
```

### 2.4 错误提示

**方案**: Monaco 内置语法检查 (Option A)

**特性**:
- ✅ 实时红色波浪线标记语法错误
- ✅ Hover 显示错误详情
- ✅ 不阻止发送请求（允许发送非法 JSON）
- ✅ 与 VSCode 体验一致

### 2.5 UI 变更

**移除**:
- ❌ `<button id="format-btn">Beautify JSON</button>`
- ❌ `.format-button` CSS 样式
- ❌ `formatJSON()` 按钮点击事件

**新增**:
- ✅ Monaco Editor 容器
- ✅ 编辑器初始化代码
- ✅ 自动格式化逻辑

---

## 3. 功能需求

### 3.1 核心功能

#### FR-1: Monaco Editor 集成
- **描述**: 将 `<textarea id="body">` 替换为 Monaco Editor
- **验收标准**:
  - [ ] Monaco Editor 正确渲染
  - [ ] 编辑器高度自适应
  - [ ] 支持基本的编辑操作（输入、删除、选择、复制、粘贴）
  - [ ] 与 VSCode 主题同步

#### FR-2: JSON 语法高亮
- **描述**: 对 JSON 内容进行语法高亮
- **验收标准**:
  - [ ] 字符串显示为橙色/绿色
  - [ ] 键名显示为蓝色
  - [ ] 数字、布尔值、null 正确着色
  - [ ] 括号匹配高亮

#### FR-3: 自动格式化（粘贴时）
- **描述**: 粘贴 JSON 内容时自动格式化
- **触发条件**: 检测到 `paste` 事件
- **验收标准**:
  - [ ] 粘贴压缩的 JSON 后自动格式化为 2 空格缩进
  - [ ] 粘贴非 JSON 内容时不格式化
  - [ ] 格式化不丢失数据

**测试用例**:
```json
// 输入（粘贴）
{"name":"test","value":123,"nested":{"key":"value"}}

// 输出（自动格式化）
{
  "name": "test",
  "value": 123,
  "nested": {
    "key": "value"
  }
}
```

#### FR-4: 自动格式化（失焦时）
- **描述**: 失焦时如果内容变化且为 JSON，自动格式化
- **触发条件**: `blur` 事件 + 内容变化
- **验收标准**:
  - [ ] 点击外部区域触发格式化
  - [ ] 内容未变化时不格式化
  - [ ] 非 JSON 内容不格式化

#### FR-5: 语言自动检测
- **描述**: 根据 Content-Type 和内容自动切换编辑器语言
- **验收标准**:
  - [ ] Content-Type 包含 `json` 时使用 JSON 模式
  - [ ] Content-Type 包含 `xml` 时使用 XML 模式
  - [ ] 无 Content-Type 时尝试解析为 JSON
  - [ ] 解析失败降级为 Plain Text

**测试矩阵**:
| Content-Type | Body 内容 | 期望语言 |
|--------------|-----------|---------|
| `application/json` | `{"a":1}` | JSON |
| `text/xml` | `<root/>` | XML |
| 无 | `{"a":1}` | JSON (智能检测) |
| 无 | `plain text` | Plain Text |

#### FR-6: 错误提示
- **描述**: 实时显示 JSON 语法错误
- **验收标准**:
  - [ ] 语法错误处显示红色波浪线
  - [ ] Hover 显示错误消息
  - [ ] 不阻止发送请求
  - [ ] 错误修复后波浪线消失

#### FR-7: 移除 Beautify 按钮
- **描述**: 删除手动格式化按钮及相关代码
- **验收标准**:
  - [ ] UI 中不再显示 "Beautify JSON" 按钮
  - [ ] 删除 `.body-actions` 容器（如果为空）
  - [ ] 删除 `formatJSON()` 函数（如果仅按钮使用）
  - [ ] 删除按钮点击事件监听器

### 3.2 非功能需求

#### NFR-1: 性能
- **要求**:
  - [ ] 编辑器初始化时间 < 500ms
  - [ ] 大文件（> 1MB）时不卡顿
  - [ ] 自动格式化延迟 < 100ms

#### NFR-2: 兼容性
- **要求**:
  - [ ] 兼容 VSCode 暗色/亮色主题
  - [ ] 不影响现有的请求发送逻辑
  - [ ] 不破坏 Headers 标签页功能

#### NFR-3: 可维护性
- **要求**:
  - [ ] 代码清晰，易于理解
  - [ ] 关键函数添加注释
  - [ ] 遵循项目现有代码风格

---

## 4. 实现细节

### 4.1 Monaco Editor 集成步骤

#### 步骤 1: 在 Webview 中加载 Monaco
```html
<!-- 在 _getHtmlForWebview 方法中 -->
<script src="${monacoUri}/vs/loader.js"></script>
<script>
  require.config({ paths: { 'vs': '${monacoUri}/vs' }});
  require(['vs/editor/editor.main'], function() {
    initBodyEditor();
  });
</script>
```

#### 步骤 2: 初始化编辑器
```typescript
function initBodyEditor() {
  const editor = monaco.editor.create(document.getElementById('body-editor'), {
    value: '',
    language: 'json',
    theme: getVSCodeTheme(),
    automaticLayout: true,
    minimap: { enabled: false },
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    fontSize: 13,
    fontFamily: 'Consolas, Monaco, monospace'
  });
  
  // 保存引用
  window.bodyEditor = editor;
}
```

#### 步骤 3: 实现自动格式化
```typescript
// 粘贴时格式化
editor.onDidPaste(() => {
  setTimeout(() => {
    if (editor.getModel().getLanguageId() === 'json') {
      editor.getAction('editor.action.formatDocument').run();
    }
  }, 50);
});

// 失焦时格式化
let lastContent = editor.getValue();
editor.onDidBlurEditorText(() => {
  const currentContent = editor.getValue();
  if (currentContent !== lastContent && isValidJSON(currentContent)) {
    editor.getAction('editor.action.formatDocument').run();
    lastContent = currentContent;
  }
});
```

#### 步骤 4: 语言检测
```typescript
function updateEditorLanguage() {
  const contentType = getActiveContentType(); // 从 Headers 获取
  const body = editor.getValue();
  const lang = detectLanguage(body, contentType);
  monaco.editor.setModelLanguage(editor.getModel(), lang);
}

// 监听 Content-Type 变化
watchHeadersChange('Content-Type', updateEditorLanguage);
```

### 4.2 HTML 结构变更

**Before**:
```html
<div class="body-editor">
  <textarea class="body-textarea" id="body" placeholder="Request body"></textarea>
  <div class="body-actions">
    <button class="format-button" id="format-btn">Beautify JSON</button>
  </div>
</div>
```

**After**:
```html
<div class="body-editor">
  <div id="body-editor" class="monaco-container"></div>
</div>
```

### 4.3 CSS 样式调整

**移除**:
```css
.body-textarea { ... }
.body-actions { ... }
.format-button { ... }
```

**新增**:
```css
.monaco-container {
  flex: 1;
  min-height: 300px;
  border: 1px solid var(--input-border);
  border-radius: var(--border-radius);
}
```

### 4.4 发送请求时获取内容

**Before**:
```typescript
const body = document.getElementById('body').value;
```

**After**:
```typescript
const body = window.bodyEditor.getValue();
```

---

## 5. 数据流

### 5.1 编辑器初始化流程
```
1. Webview 加载
2. 加载 Monaco Loader
3. 初始化 Monaco Editor
4. 设置默认语言（JSON）
5. 绑定事件监听器
   ├─ onDidPaste (粘贴)
   ├─ onDidBlurEditorText (失焦)
   └─ onDidChangeModelContent (内容变化)
```

### 5.2 自动格式化流程
```
用户操作 → 触发事件 → 检测条件 → 格式化
    │
    ├─ 粘贴 → onDidPaste → 延迟 50ms → formatDocument()
    │
    └─ 失焦 → onDidBlurEditorText → 内容变化? → formatDocument()
```

### 5.3 语言检测流程
```
1. Headers 中 Content-Type 变化
2. 触发 updateEditorLanguage()
3. detectLanguage(body, contentType)
4. monaco.editor.setModelLanguage()
```

---

## 6. 测试计划

### 6.1 功能测试

#### 测试用例 1: Monaco Editor 渲染
- **步骤**:
  1. 打开 HTTP Client 面板
  2. 切换到 Body 标签页
- **期望**: 显示 Monaco Editor，有行号，可编辑

#### 测试用例 2: JSON 语法高亮
- **步骤**:
  1. 输入 JSON: `{"name": "test", "count": 123}`
  2. 观察颜色
- **期望**: 键名为蓝色，字符串为橙色，数字为其他颜色

#### 测试用例 3: 粘贴时自动格式化
- **步骤**:
  1. 复制压缩的 JSON: `{"a":1,"b":{"c":2}}`
  2. 粘贴到编辑器
  3. 等待 100ms
- **期望**: 自动格式化为缩进格式

#### 测试用例 4: 失焦时自动格式化
- **步骤**:
  1. 手动输入: `{"a":1,"b":2}`
  2. 点击编辑器外部
- **期望**: 自动格式化

#### 测试用例 5: 语法错误提示
- **步骤**:
  1. 输入错误的 JSON: `{"name": "test",}`
  2. 观察编辑器
- **期望**: 最后的逗号下方显示红色波浪线

#### 测试用例 6: 语言自动检测
- **步骤**:
  1. 在 Headers 中设置 `Content-Type: text/xml`
  2. 输入 XML 内容
- **期望**: 编辑器切换到 XML 语法高亮

#### 测试用例 7: Beautify 按钮已移除
- **步骤**:
  1. 打开 Body 标签页
  2. 检查 UI
- **期望**: 不显示 "Beautify JSON" 按钮

#### 测试用例 8: 发送请求正常
- **步骤**:
  1. 输入 Body 内容
  2. 点击 Send 按钮
  3. 检查请求日志
- **期望**: Body 内容正确发送

### 6.2 边界测试

| 测试场景 | 输入 | 期望行为 |
|---------|------|---------|
| 空内容 | `""` | 不格式化，不报错 |
| 非法 JSON | `{invalid}` | 显示错误，允许发送 |
| 大文件 | 1MB+ JSON | 能够加载，可能禁用某些特性 |
| 特殊字符 | Unicode, 转义字符 | 正确显示和发送 |
| 非 JSON | Plain text | 不格式化，不报错 |

### 6.3 性能测试

| 指标 | 目标 | 测试方法 |
|-----|------|---------|
| 编辑器初始化 | < 500ms | 使用 `performance.now()` 测量 |
| 格式化延迟 | < 100ms | 粘贴后到格式化完成的时间 |
| 大文件加载 | 1MB 可用 | 测试大 JSON 文件 |

---

## 7. 风险和缓解

### 风险 1: Monaco Editor 在 Webview 中加载失败
- **概率**: 中
- **影响**: 高
- **缓解**: 
  - 测试多个 Monaco 版本
  - 提供降级方案（保留 textarea）
  - 添加详细错误日志

### 风险 2: 自动格式化导致性能问题
- **概率**: 低
- **影响**: 中
- **缓解**: 
  - 添加内容大小检查（> 1MB 禁用自动格式化）
  - 使用 debounce 限制频率
  - 提供开关选项

### 风险 3: 主题同步问题
- **概率**: 中
- **影响**: 低
- **缓解**: 
  - 检测 VSCode 主题变化
  - 提供默认主题映射
  - 允许用户自定义

### 风险 4: 破坏现有功能
- **概率**: 低
- **影响**: 高
- **缓解**: 
  - 充分测试所有现有功能
  - 保持 API 兼容性（getValue/setValue）
  - 创建功能分支，渐进式集成

---

## 8. 依赖和约束

### 8.1 技术依赖
- ✅ Monaco Editor (VSCode 内置，无需额外安装)
- ✅ VSCode Webview API
- ✅ TypeScript

### 8.2 项目约束
- ⚠️ **不能添加外部依赖**: 必须使用 VSCode 内置的 Monaco
- ⚠️ **不能破坏现有功能**: Headers, Response 等功能必须正常工作
- ⚠️ **保持一致性**: UI 风格与现有设计一致

---

## 9. 发布计划

### 9.1 实施阶段

**Phase 1: 基础集成** (2 hours)
- [ ] 加载 Monaco Editor
- [ ] 替换 textarea
- [ ] 基本编辑功能

**Phase 2: 自动格式化** (1 hour)
- [ ] 实现粘贴时格式化
- [ ] 实现失焦时格式化
- [ ] 添加格式化规则

**Phase 3: 语言检测** (1 hour)
- [ ] 实现 Content-Type 检测
- [ ] 实现智能降级
- [ ] 测试多种语言

**Phase 4: 清理和优化** (0.5 hour)
- [ ] 移除 Beautify 按钮
- [ ] 删除无用代码
- [ ] 优化性能

**Phase 5: 测试和文档** (1.5 hours)
- [ ] 功能测试
- [ ] 边界测试
- [ ] 更新文档

### 9.2 版本发布
- **目标版本**: v0.2.0
- **发布时间**: Phase 5 完成后
- **变更说明**: 
  - ✅ 新增: Monaco Editor 集成
  - ✅ 新增: JSON 自动格式化和语法高亮
  - ❌ 移除: Beautify JSON 按钮

---

## 10. 验收标准

### 10.1 功能完整性
- [ ] Monaco Editor 正确渲染和工作
- [ ] JSON 语法高亮正常
- [ ] 粘贴时自动格式化
- [ ] 失焦时自动格式化
- [ ] 语言自动检测
- [ ] 错误提示正常显示
- [ ] Beautify 按钮已移除

### 10.2 质量标准
- [ ] 所有测试用例通过
- [ ] 无 TypeScript 编译错误
- [ ] 无明显性能问题
- [ ] 与 VSCode 主题匹配

### 10.3 文档完整性
- [ ] 代码注释清晰
- [ ] README 更新（如果需要）
- [ ] CHANGELOG 更新

---

## 11. 后续优化（未来版本）

- [ ] 支持更多语言（YAML, GraphQL, etc.）
- [ ] 添加代码片段（Snippets）
- [ ] 支持自定义格式化规则
- [ ] 添加 JSON Schema 验证
- [ ] 支持大文件虚拟滚动
- [ ] 添加搜索和替换功能

---

## 附录

### A. Monaco Editor API 参考
- [Monaco Editor API](https://microsoft.github.io/monaco-editor/api/index.html)
- [VSCode Webview Guide](https://code.visualstudio.com/api/extension-guides/webview)

### B. 格式化示例

**输入**:
```json
{"name":"John","age":30,"address":{"city":"New York","zip":"10001"},"tags":["developer","javascript"]}
```

**输出**:
```json
{
  "name": "John",
  "age": 30,
  "address": {
    "city": "New York",
    "zip": "10001"
  },
  "tags": [
    "developer",
    "javascript"
  ]
}
```

---

**规格版本**: 1.0.0  
**最后更新**: 2025-10-11  
**审核状态**: ✅ Ready for Implementation

