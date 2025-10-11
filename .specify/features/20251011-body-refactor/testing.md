# Body 编辑器重构 - 测试报告

**Feature**: Monaco Editor 集成  
**Version**: v0.2.0  
**Date**: 2025-10-11  
**Status**: ✅ Ready for Manual Testing

---

## 🎯 已实现的功能

### ✅ 核心功能

1. **Monaco Editor 集成** ✅
   - 替换了旧的 `<textarea>` 
   - 使用 VSCode 内置的 Monaco Editor
   - 行号、语法高亮、错误提示

2. **自动格式化** ✅
   - **粘贴时自动格式化**: 粘贴 JSON 后自动格式化为 2 空格缩进
   - **失焦时自动格式化**: 编辑后点击外部区域自动格式化
   - **智能验证**: 只格式化有效的 JSON，非法 JSON 不格式化

3. **语言自动检测** ✅
   - 根据 Headers 中的 `Content-Type` 自动切换语言
   - 智能降级：无 Content-Type 时尝试解析内容
   - 支持语言：JSON, XML, HTML, JavaScript, YAML, Plain Text

4. **语法高亮** ✅
   - JSON: 键名、字符串、数字、布尔值、null 不同颜色
   - XML: 标签、属性高亮
   - 其他语言：根据 Monaco 内置语法

5. **错误提示** ✅
   - Monaco 内置 JSON 语法检查
   - 错误处显示红色波浪线
   - Hover 显示错误详情

6. **Beautify 按钮移除** ✅
   - 已移除 "Beautify JSON" 按钮
   - 自动格式化替代手动操作

---

## 🧪 测试指南

### 前置条件
1. 运行 `npm install` 确保 `monaco-editor` 已安装
2. 运行 `npm run compile` 编译项目
3. 按 F5 启动调试模式

---

### 测试用例 1: Monaco Editor 渲染

**步骤**:
1. 打开 HTTP Client 面板
2. 切换到 Body 标签页
3. 观察编辑器

**期望结果**:
- ✅ 显示 Monaco Editor（不是 textarea）
- ✅ 有行号
- ✅ 可以正常输入文字
- ✅ 主题与 VSCode 一致（暗色/亮色）

**状态**: ⏳ 待测试

---

### 测试用例 2: JSON 语法高亮

**步骤**:
1. 在 Body 编辑器中输入：
```json
{
  "name": "test",
  "count": 123,
  "active": true,
  "data": null
}
```
2. 观察颜色

**期望结果**:
- ✅ `"name"` 等键名显示为一种颜色（通常蓝色）
- ✅ `"test"` 等字符串显示为另一种颜色（通常橙色/棕色）
- ✅ `123` 数字显示不同颜色（通常绿色）
- ✅ `true`, `null` 关键字显示特殊颜色（通常蓝色）

**状态**: ⏳ 待测试

---

### 测试用例 3: 粘贴时自动格式化

**步骤**:
1. 复制以下压缩的 JSON：
```
{"name":"John","age":30,"address":{"city":"New York","zip":"10001"},"tags":["developer","javascript"]}
```
2. 粘贴到 Body 编辑器
3. 等待 100ms

**期望结果**:
- ✅ 自动格式化为：
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
- ✅ 使用 2 空格缩进
- ✅ 数据完整无丢失

**状态**: ⏳ 待测试

---

### 测试用例 4: 失焦时自动格式化

**步骤**:
1. 在 Body 编辑器手动输入：
```
{"a":1,"b":2,"c":3}
```
2. 点击编辑器外部（例如点击 URL 输入框）
3. 观察 Body 编辑器

**期望结果**:
- ✅ 自动格式化为：
```json
{
  "a": 1,
  "b": 2,
  "c": 3
}
```

**状态**: ⏳ 待测试

---

### 测试用例 5: 语法错误提示

**步骤**:
1. 在 Body 编辑器输入非法 JSON：
```json
{
  "name": "test",
}
```
（注意最后的逗号是语法错误）
2. 观察编辑器

**期望结果**:
- ✅ 最后的逗号下方显示红色波浪线
- ✅ Hover 到错误处显示提示信息
- ✅ 不会自动格式化（因为是非法 JSON）

**状态**: ⏳ 待测试

---

### 测试用例 6: 语言自动检测 - Content-Type

**步骤**:
1. 在 Headers 标签页添加：
   - Key: `Content-Type`
   - Value: `text/xml`
   - 勾选启用
2. 切换到 Body 标签页
3. 输入：
```xml
<root>
  <item>test</item>
</root>
```

**期望结果**:
- ✅ 编辑器切换到 XML 语言模式
- ✅ XML 标签有语法高亮
- ✅ 不会尝试格式化为 JSON

**测试矩阵**:
| Content-Type | 期望语言 |
|--------------|---------|
| `application/json` | JSON |
| `text/xml` | XML |
| `text/html` | HTML |
| `application/javascript` | JavaScript |
| `application/x-yaml` | YAML |

**状态**: ⏳ 待测试

---

### 测试用例 7: 智能语言检测（无 Content-Type）

**步骤**:
1. 确保 Headers 中没有 `Content-Type` 或取消勾选
2. 在 Body 输入 JSON：`{"test": 123}`
3. 观察语法高亮

**期望结果**:
- ✅ 自动识别为 JSON 模式
- ✅ 有 JSON 语法高亮

**步骤**:
4. 清空 Body
5. 输入纯文本：`This is plain text`

**期望结果**:
- ✅ 识别为 Plain Text 模式
- ✅ 无特殊高亮

**状态**: ⏳ 待测试

---

### 测试用例 8: 发送请求功能正常

**步骤**:
1. 输入 URL: `https://jsonplaceholder.typicode.com/posts`
2. 方法选择: `POST`
3. Headers 添加: `Content-Type: application/json`
4. Body 输入：
```json
{
  "title": "Test Post",
  "body": "This is a test",
  "userId": 1
}
```
5. 点击 Send 按钮

**期望结果**:
- ✅ 请求成功发送
- ✅ Body 内容正确发送到服务器
- ✅ Response 区域显示响应数据
- ✅ 状态码显示为 201 Created

**状态**: ⏳ 待测试

---

### 测试用例 9: 加载保存的请求

**步骤**:
1. 从侧边栏加载一个保存的请求（包含 Body 数据）
2. 观察 Body 编辑器

**期望结果**:
- ✅ Body 内容正确加载到 Monaco Editor
- ✅ 语法高亮正常
- ✅ 如果是 JSON，自动格式化显示

**状态**: ⏳ 待测试

---

### 测试用例 10: Beautify 按钮已移除

**步骤**:
1. 打开 Body 标签页
2. 检查 UI

**期望结果**:
- ✅ 不显示 "Beautify JSON" 按钮
- ✅ 编辑器下方没有按钮栏

**状态**: ⏳ 待测试

---

## 📊 边界测试

### 边界 1: 空内容

**输入**: 空字符串  
**期望**: 编辑器正常，不报错，不格式化  
**状态**: ⏳ 待测试

### 边界 2: 非常大的 JSON

**输入**: 1MB+ 的 JSON 文件  
**期望**: 能够加载，可能性能略慢但可用  
**状态**: ⏳ 待测试

### 边界 3: 特殊字符

**输入**: 
```json
{
  "emoji": "😀",
  "unicode": "\u4e2d\u6587",
  "escaped": "Line1\nLine2\tTab"
}
```
**期望**: 正确显示和发送，格式化后保持不变  
**状态**: ⏳ 待测试

### 边界 4: 不完整的 JSON

**输入**: `{"name": "test`（未闭合）  
**期望**: 显示语法错误，不自动格式化，允许发送  
**状态**: ⏳ 待测试

---

## 🔧 已知问题和限制

### 限制 1: 主题同步
**问题**: Monaco Editor 主题硬编码为 `vs-dark`  
**影响**: 如果用户使用亮色主题，编辑器仍然是暗色  
**优先级**: 低  
**解决方案**: 未来可以检测 VSCode 主题并动态切换

### 限制 2: 大文件性能
**问题**: 超大 JSON (> 5MB) 可能导致格式化慢  
**影响**: 格式化延迟可能超过 1 秒  
**优先级**: 低  
**解决方案**: 可以添加文件大小检查，禁用大文件自动格式化

---

## ✅ 验收标准

### 功能完整性
- [ ] 所有 10 个测试用例通过
- [ ] 无明显 bug
- [ ] 与现有功能无冲突

### 性能
- [ ] 编辑器初始化 < 500ms
- [ ] 自动格式化延迟 < 100ms（正常大小 JSON）
- [ ] 输入流畅，无卡顿

### 兼容性
- [ ] 与 Headers 功能兼容
- [ ] 与 Response 显示兼容
- [ ] 不影响保存/加载请求功能

---

## 🚀 测试步骤

### Quick Start

1. **编译项目**
```bash
npm run compile
```

2. **启动调试**
```bash
# 按 F5 或运行
code --extensionDevelopmentPath=/Users/shadow/Documents/code/Tunder-Client
```

3. **打开 HTTP Client**
- 点击 Activity Bar 中的 Tunder 图标
- 或运行命令: `Tunder: Open HTTP Client`

4. **运行测试用例**
- 按照上面的 10 个测试用例逐一测试
- 记录结果：✅ 通过 / ❌ 失败 / ⚠️ 部分通过

5. **检查开发者控制台**
```
Cmd + Shift + P → "Toggle Developer Tools"
```
- 查看是否有 JavaScript 错误
- 确认 Monaco Editor 加载成功

---

## 📝 测试结果模板

```markdown
### 测试执行记录

**测试人**: [Your Name]
**测试日期**: 2025-10-11
**测试环境**: VSCode [version], macOS [version]

| 测试用例 | 状态 | 备注 |
|---------|------|------|
| TC1: Monaco 渲染 | ⏳ | |
| TC2: 语法高亮 | ⏳ | |
| TC3: 粘贴格式化 | ⏳ | |
| TC4: 失焦格式化 | ⏳ | |
| TC5: 错误提示 | ⏳ | |
| TC6: Content-Type 检测 | ⏳ | |
| TC7: 智能检测 | ⏳ | |
| TC8: 发送请求 | ⏳ | |
| TC9: 加载请求 | ⏳ | |
| TC10: 按钮移除 | ⏳ | |

**总结**: 
- ✅ 通过: 0/10
- ❌ 失败: 0/10
- ⏳ 待测: 10/10
```

---

## 🐛 Bug 报告模板

如果发现问题，请使用以下模板：

```markdown
### Bug #[N]: [简短描述]

**严重程度**: 🔴 高 / 🟡 中 / 🟢 低

**重现步骤**:
1. ...
2. ...
3. ...

**期望结果**:
...

**实际结果**:
...

**截图/日志**:
[附上截图或控制台日志]

**环境**:
- VSCode 版本: ...
- 扩展版本: v0.2.0
- 操作系统: ...
```

---

## 📈 下一步

1. **手动测试**: 运行所有测试用例
2. **修复 Bug**: 如果发现问题，记录并修复
3. **性能优化**: 如果有性能问题，进行优化
4. **文档更新**: 更新 README 和 CHANGELOG
5. **发布**: 如果测试通过，发布 v0.2.0

---

**状态**: ✅ **代码实现完成，等待手动测试**

**推荐测试顺序**:
1. TC1, TC2 (基础渲染和高亮)
2. TC3, TC4 (自动格式化)
3. TC8, TC9 (功能集成)
4. TC5, TC6, TC7 (高级特性)
5. TC10 (UI 清理)

测试愉快！🚀

