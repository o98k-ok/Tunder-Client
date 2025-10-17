# Tunder Client

<div align="center">

**轻量级的 VS Code REST API 客户端插件**

专注于**简洁性、清晰的设计和本地存储**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.60.0+-blue.svg)](https://code.visualstudio.com/)

> 免费！永远免费 🎉

</div>

---

## ✨ 主要特性

* 🪶 **轻量级**：简单易用的 REST API 客户端，无需复杂配置
* 💾 **本地存储**：所有数据保存在用户本地设备上，保护隐私
* 📁 **请求管理**：支持文件夹组织和管理 API 请求
* 📥 **cURL 导入**：一键导入 cURL 命令，快速创建请求
* 🍪 **Cookie 支持**：自动处理 Cookie，支持 `-b` 参数
* 💾 **自动保存**：实时保存请求更改，无需手动操作
* 🎨 **直观的界面**：
  * 彩色标记的 HTTP 方法（GET、POST、PUT 等）
  * 文件夹树状结构展示
  * 简洁的请求编辑界面
  * Monaco 编辑器支持（语法高亮、自动格式化）
* ⚡ **响应时间显示**：实时显示请求耗时
* 📋 **智能粘贴**：支持 Command+V/Ctrl+V 粘贴 JSON 内容
* 🔧 **JSON 格式化**：一键格式化 JSON 请求体

---

## 📸 界面预览

![Tunder Client 界面](https://github.com/o98k-ok/Tunder-Client/raw/main/media/image.png)

**左侧面板**：
* 请求列表视图
* 使用不同颜色区分 HTTP 方法
* 树状文件夹结构
* 简洁的请求名称显示

**右侧面板**：
* 格式化的请求体编辑器
* 优化尺寸的发送按钮
* 响应数据实时预览
* 自动保存指示器

---

## 🚀 快速开始

### 安装

1. 在 VS Code 扩展市场搜索 "Tunder Client"
2. 点击安装
3. 点击 VS Code 活动栏上的 Tunder Client 图标

### 基本使用

1. **创建请求**：在侧边栏中点击"➕ 创建请求"按钮
2. **编辑请求**：填写 URL、选择方法、添加头部和请求体
3. **发送请求**：点击"发送"按钮测试 API
4. **查看响应**：在下方面板查看响应数据

---

## 📥 cURL 导入功能

快速从 cURL 命令创建请求，节省 80% 的时间！

### 使用方法

1. **从目录导入**：右键点击目录 → 选择"📥 导入 cURL"
2. **从工具栏导入**：点击工具栏的"📥 导入 cURL 命令"按钮
3. 粘贴 cURL 命令
4. 点击确定，请求将自动创建并打开

### 示例

#### 基本 POST 请求
```bash
curl -X POST https://api.example.com/v1/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token123" \
  -d '{"name":"John","email":"john@example.com"}'
```

#### 带 Cookie 的请求
```bash
# 单个 cookie
curl https://api.example.com -b "session_id=abc123"

# 多个 cookies
curl https://api.example.com \
  -b "session_id=abc123" \
  -b "user_pref=dark_mode"
```

#### GET 请求with查询参数
```bash
curl https://api.example.com/search?q=test&limit=10
```

### 支持的 cURL 选项

| 选项 | 说明 | 示例 |
|------|------|------|
| `-X`, `--request` | HTTP 方法 | `-X POST` |
| `-H`, `--header` | 请求头 | `-H "Content-Type: application/json"` |
| `-d`, `--data`, `--data-raw` | 请求体 | `-d '{"key":"value"}'` |
| `-b`, `--cookie` | Cookies（自动转换为 Cookie 头部） | `-b "session=abc123"` |
| URL 和查询参数 | 完整 URL | `https://api.com?q=test` |

**注意**：不支持的选项（如 `-v`, `-k`, `-u` 等）会被自动忽略。

---

## 🎯 核心功能

### 📁 请求组织

* 创建多层级文件夹
* 拖拽排序（即将支持）
* 快速搜索（即将支持）
* 批量操作

### 💾 自动保存

* 实时保存请求更改
* 保存状态指示器
* 无需手动 Cmd+S
* 防抖处理，避免频繁保存

### 🎨 Monaco 编辑器

* 语法高亮（JSON、XML 等）
* 自动格式化
* 代码折叠
* 智能提示
* **智能粘贴**：支持 Command+V/Ctrl+V 粘贴内容
* **JSON 格式化按钮**：一键格式化 JSON 请求体

### ⚡ 响应时间显示

* 实时显示请求耗时
* 毫秒级精度
* 自动格式化显示（ms/s）

### 🍪 Cookie 管理

* 自动解析 cURL 中的 `-b` 参数
* 转换为标准 Cookie 头部
* 支持多个 cookies
* 自动合并现有 Cookie 头部

---

## 🛠️ 技术特点

* **基于 VS Code 扩展开发**：原生集成，性能优异
* **TypeScript 开发**：类型安全，易于维护
* **本地数据存储**：隐私保护，无需网络
* **遵循 VS Code 设计规范**：一致的用户体验
* **Monaco Editor 集成**：专业的代码编辑体验

---

## 📋 开发计划

- [x] 基础 HTTP 请求功能
- [x] 请求管理和组织
- [x] UI 优化和美化
- [x] cURL 导入功能
- [x] Cookie 支持（`-b` 参数）
- [x] 自动保存功能
- [x] Monaco 编辑器集成
- [x] 响应时间显示
- [x] 智能粘贴功能
- [x] JSON 格式化按钮
- [ ] 环境变量支持
- [ ] 请求历史记录
- [ ] 响应数据导出
- [ ] cURL 导出功能
- [ ] 批量请求测试
- [ ] GraphQL 支持

---

## 🤝 贡献

这是一个个人项目，主要用于学习和个人使用。如果你有任何建议或想法，欢迎提出。

**主要由 Cursor AI 辅助开发** 🤖

### 如何贡献

1. Fork 本仓库
2. 创建你的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交你的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个 Pull Request

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

## 🔗 相关链接

* [GitHub 仓库](https://github.com/o98k-ok/Tunder-Client)
* [问题反馈](https://github.com/o98k-ok/Tunder-Client/issues)
* [VS Code 扩展市场](https://marketplace.visualstudio.com/)

---

## 💡 提示与技巧

### 快速导入 API 文档中的 cURL

1. 从 API 文档复制 cURL 命令
2. 在 Tunder Client 中点击"导入 cURL"
3. 粘贴并导入
4. 立即测试 API

### 使用 Cookie 进行认证

```bash
# 先登录获取 cookie
curl -X POST https://api.example.com/login \
  -d '{"username":"user","password":"pass"}'

# 使用返回的 session cookie
curl https://api.example.com/profile \
  -b "session=returned_session_id"
```

### 智能粘贴功能

Tunder Client 支持在 Monaco 编辑器中直接粘贴 JSON 内容：

1. **复制 JSON 内容**到剪贴板
2. **切换到 Body 标签页**
3. **使用 Command+V (macOS) 或 Ctrl+V (Windows/Linux)** 粘贴
4. **内容自动插入**并保持 JSON 语法高亮

**特性**：
- ✅ 支持选中文本替换
- ✅ 自动设置 JSON 语言模式
- ✅ 跨平台快捷键支持
- ✅ 绕过 Webview 剪贴板限制

### JSON 格式化

使用格式化按钮快速美化 JSON 请求体：

1. **点击格式化按钮**（⚡ Format）
2. **自动验证 JSON 格式**
3. **一键美化代码**
4. **保持语法高亮**

### 组织你的请求

* 按项目创建文件夹
* 按功能模块分组
* 使用描述性名称
* 定期清理无用请求

---

<div align="center">

**感谢使用 Tunder Client！** ⚡

如果觉得有用，请给个 ⭐ Star！

</div>
