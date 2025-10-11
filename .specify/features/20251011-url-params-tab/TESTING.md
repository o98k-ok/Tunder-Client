# URL Parameters Tab - Testing Guide

**Feature**: URL Parameters Tab  
**Version**: 1.0  
**Created**: 2025-10-11

---

## Quick Start

1. **启动调试**: 按 `F5` 启动扩展调试
2. **打开 Tunder Client**: 点击侧边栏图标
3. **测试 Params 标签页**: 点击 "Params" 标签

---

## Test Scenarios

### ✅ Scenario 1: View and Edit Parameters

**目标**: 验证参数解析和编辑功能

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/search?q=test&limit=10&offset=0&sort=desc`
2. 点击 "Params" 标签页
3. 验证显示 4 个参数：
   - `q` = `test`
   - `limit` = `10`
   - `offset` = `0`
   - `sort` = `desc`
4. 修改 `limit` 的值为 `20`
5. 验证 URL 自动更新为: `...&limit=20&...`

**预期结果**: ✅ 参数正确显示，编辑后 URL 自动更新

---

### ✅ Scenario 2: Add New Parameter

**目标**: 验证添加参数功能

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/users`
2. 点击 "Params" 标签页
3. 点击 "+ Add" 按钮
4. 输入 Key: `page`, Value: `1`
5. 验证 URL 更新为: `https://api.example.com/users?page=1`
6. 再添加一个参数: `size=20`
7. 验证 URL 更新为: `https://api.example.com/users?page=1&size=20`

**预期结果**: ✅ 参数正确添加，URL 自动更新

---

### ✅ Scenario 3: Delete Parameter

**目标**: 验证删除参数功能

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/search?q=test&limit=10&offset=0`
2. 点击 "Params" 标签页
3. 点击 `offset` 参数行的删除按钮 (×)
4. 验证 URL 更新为: `https://api.example.com/search?q=test&limit=10`
5. 删除所有参数
6. 验证 URL 更新为: `https://api.example.com/search`

**预期结果**: ✅ 参数正确删除，URL 自动更新

---

### ✅ Scenario 4: URL Encoding

**目标**: 验证 URL 编码/解码功能

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/search?name=John%20Doe&email=test%40example.com`
2. 点击 "Params" 标签页
3. 验证参数显示为：
   - `name` = `John Doe` (解码后)
   - `email` = `test@example.com` (解码后)
4. 修改 `name` 为 `Jane Smith`
5. 验证 URL 更新为: `...name=Jane%20Smith...` (编码后)

**预期结果**: ✅ 参数显示解码值，URL 保持编码

---

### ✅ Scenario 5: Duplicate Keys

**目标**: 验证重复键支持

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/search?tag=red&tag=blue&tag=green`
2. 点击 "Params" 标签页
3. 验证显示 3 个 `tag` 参数：
   - `tag` = `red`
   - `tag` = `blue`
   - `tag` = `green`
4. 删除第二个 `tag` (blue)
5. 验证 URL 更新为: `...tag=red&tag=green`

**预期结果**: ✅ 重复键正确显示和处理

---

### ✅ Scenario 6: Empty Values

**目标**: 验证空值和无值参数

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/search?q=&flag&key=value`
2. 点击 "Params" 标签页
3. 验证显示 3 个参数：
   - `q` = `` (空值)
   - `flag` = `` (无值)
   - `key` = `value`
4. 修改 `q` 为 `test`
5. 验证 URL 更新为: `...q=test&flag&key=value`

**预期结果**: ✅ 空值和无值参数正确处理

---

### ✅ Scenario 7: Bidirectional Sync

**目标**: 验证双向同步

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/search?q=test`
2. 点击 "Params" 标签页
3. 验证显示 `q=test`
4. 切换到 "Headers" 标签页
5. 在 URL 输入框修改为: `https://api.example.com/search?q=test&limit=10`
6. 切换回 "Params" 标签页
7. 验证显示 2 个参数：`q=test` 和 `limit=10`

**预期结果**: ✅ URL 和 Params 标签页保持同步

---

### ✅ Scenario 8: Empty State

**目标**: 验证空状态显示

**步骤**:
1. 在 URL 输入框输入: `https://api.example.com/users`
2. 点击 "Params" 标签页
3. 验证显示提示信息: "No parameters. Add one to get started."
4. 点击 "+ Add" 按钮
5. 验证空状态消失，显示输入行

**预期结果**: ✅ 空状态友好显示

---

## Edge Cases to Test

### 🔍 Edge Case 1: Invalid URL
- **输入**: `not-a-valid-url`
- **预期**: Params 标签页显示空状态，不崩溃

### 🔍 Edge Case 2: Very Long URL
- **输入**: URL 包含 50+ 个参数
- **预期**: 所有参数正确显示，性能良好 (< 50ms)

### 🔍 Edge Case 3: Special Characters
- **输入**: `?name=中文&emoji=😀&symbol=@#$%`
- **预期**: 特殊字符正确编码/解码

### 🔍 Edge Case 4: URL Fragment
- **输入**: `https://api.com/path?q=test#section`
- **预期**: Fragment 不影响参数解析

---

## Performance Checklist

- [ ] 解析 100+ 参数的 URL < 50ms
- [ ] UI 更新延迟 < 100ms
- [ ] 无阻塞主线程
- [ ] 防抖正常工作（300ms）

---

## Integration Checklist

- [ ] 不影响 Headers 标签页
- [ ] 不影响 Body 标签页
- [ ] 不影响请求发送功能
- [ ] 自动保存正常工作
- [ ] Tab 切换流畅

---

## Browser Compatibility

- ✅ URLSearchParams API (现代浏览器都支持)
- ✅ URL API (现代浏览器都支持)
- ✅ VSCode Webview (基于 Electron/Chromium)

---

## Known Limitations

1. **Path Parameters**: 不支持路径参数 (e.g., `/users/:id`)
2. **URL Fragment**: 不处理 URL fragment (e.g., `#section`)
3. **Parameter Validation**: 不验证参数格式

---

## Troubleshooting

### 问题: Params 标签页不显示
- **检查**: 确认 HTML 中添加了 `<div class="tab" data-tab="params">Params</div>`
- **检查**: 确认 `params-tab` 元素存在

### 问题: URL 不更新
- **检查**: 打开浏览器控制台查看错误
- **检查**: 确认 `updateUrlFromParams()` 函数正常执行

### 问题: 参数不显示
- **检查**: 确认 URL 格式正确 (包含 `?`)
- **检查**: 确认 `parseUrlParams()` 函数正常工作

---

## Success Criteria

- [x] ✅ Params 标签页显示
- [x] ✅ URL 参数正确解析
- [x] ✅ 参数增删改功能正常
- [x] ✅ URL 和 Params 双向同步
- [x] ✅ URL 编码/解码正确
- [x] ✅ 支持重复键
- [x] ✅ 空状态友好显示
- [ ] 🔄 所有测试场景通过

---

## Next Steps

1. **手动测试**: 按照上述场景逐一测试
2. **修复 Bug**: 记录并修复发现的问题
3. **性能测试**: 测试大量参数的性能
4. **用户反馈**: 收集用户使用反馈

---

<div align="center">

**准备好测试了！** 🚀

按 `F5` 启动调试，开始测试 Params 标签页功能

</div>

