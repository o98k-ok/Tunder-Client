# 左侧请求列表 UI 重构 - 实施计划

## 功能概述
重构左侧请求列表，使用彩色方法标签（GET/POST/PUT）替代圆点图标，与参考设计保持视觉一致。

## 状态
- **Status**: Planning
- **Created**: 2025-10-11
- **Feature Spec**: [spec.md](./spec.md)

---

## 技术背景

### 当前实现分析

**核心文件**: `src/views/DirectoryTreeProvider.ts`

**当前实现**:
```typescript
class RequestTreeItem extends vscode.TreeItem {
    constructor(label, id, method) {
        super(label, vscode.TreeItemCollapsibleState.None);
        
        // 当前：使用彩色圆点图标
        this.iconPath = new vscode.ThemeIcon('circle-filled', new vscode.ThemeColor(color));
        
        // 方法名显示在右侧 description
        this.description = `${method}`;
    }
}
```

**需要改为**:
- 方法标签显示在请求名称左侧
- 标签有彩色背景和白色文字
- 圆角矩形样式

### VSCode TreeView API 限制

**关键限制**:
1. TreeView 不支持自定义 HTML 渲染
2. 只能使用 `label`、`description`、`iconPath`、`tooltip` 等属性
3. 不支持 CSS 样式自定义

**可行方案**:

| 方案 | 实现方式 | 优点 | 缺点 | 推荐 |
|------|---------|------|------|------|
| **A: Label 拼接** | 在 `label` 中使用 ANSI 颜色码或 Unicode 字符 | 简单 | 样式受限；可能不支持彩色背景 | ❌ |
| **B: 自定义 SVG 图标** | 为每个方法生成 SVG 标签图标 | 完全控制样式 | 需要生成多个 SVG 文件 | ✅ **推荐** |
| **C: 文件装饰器** | 使用 FileDecorationProvider API | 可添加徽章 | 仅支持简单文本，无法实现圆角标签 | ❌ |

**决策**: 选择方案 B - 自定义 SVG 图标

---

## 章程合规检查

### 原则 1: 接口文档完整性 ✅
- VSCode TreeView API: [TreeView Guide](https://code.visualstudio.com/api/extension-guides/tree-view)
- TreeItem API: [TreeItem Reference](https://code.visualstudio.com/api/references/vscode-api#TreeItem)
- ThemeColor API: [ThemeColor Reference](https://code.visualstudio.com/api/references/vscode-api#ThemeColor)

### 原则 2: 执行明确性 ✅
- 明确使用 SVG 图标方案
- 颜色映射已明确定义
- 验收标准清晰

### 原则 3: 业务理解 ✅
- 用户需求：视觉一致性，与参考设计保持一致
- 不影响现有功能

### 原则 4: 代码复用 ✅
- 复用现有 `DirectoryTreeProvider` 结构
- 只修改 `RequestTreeItem` 的图标生成逻辑

### 原则 5: 测试规范 ⚠️
- 行动项：手动测试视觉效果和功能完整性

### 原则 6: 架构一致性 ✅
- 不修改数据模型
- 不改变 TreeView 架构
- 仅更新视觉呈现层

### 原则 7: 知识诚实 ✅
- 明确 VSCode API 限制
- 提前验证 SVG 图标方案可行性

### 原则 8: 重构谨慎 ✅
- 只修改视觉呈现，不改变功能逻辑
- 保持向后兼容

---

## Phase 0: 技术验证

### R1: SVG 图标方案验证

**目标**: 验证 VSCode TreeView 是否支持自定义 SVG 图标

**验证步骤**:
1. 创建测试 SVG 文件
2. 在 TreeItem 中使用 `iconPath` 指向 SVG
3. 验证显示效果

**SVG 图标设计**:
```svg
<!-- GET 标签示例 -->
<svg width="40" height="18" xmlns="http://www.w3.org/2000/svg">
  <rect width="40" height="18" rx="3" fill="#73BF69"/>
  <text x="20" y="13" font-family="Arial" font-size="11" 
        font-weight="bold" fill="white" text-anchor="middle">GET</text>
</svg>
```

**颜色定义**:
- GET: `#73BF69` (绿色)
- POST: `#4A90E2` (蓝色)
- PUT: `#E8A434` (橙色)
- DELETE: `#F44747` (红色)
- PATCH: `#FFCC00` (黄色)
- HEAD: `#C586C0` (紫色)
- OPTIONS: `#858585` (灰色)

---

## Phase 1: 设计与准备

### 1.1 SVG 图标生成

**任务**: 为每个 HTTP 方法生成 SVG 标签图标

**文件结构**:
```
media/
  method-badges/
    get.svg
    post.svg
    put.svg
    delete.svg
    patch.svg
    head.svg
    options.svg
```

**SVG 规格**:
- 宽度: 40-50px（根据文字长度调整）
- 高度: 18px
- 圆角: 3px
- 字体: Arial, 11px, bold
- 文字颜色: 白色 (#FFFFFF)

### 1.2 图标路径管理

**工具函数**:
```typescript
function getMethodBadgeIcon(method: string, extensionUri: vscode.Uri): vscode.Uri {
    const methodLower = method.toLowerCase();
    return vscode.Uri.joinPath(extensionUri, 'media', 'method-badges', `${methodLower}.svg`);
}
```

---

## Phase 2: 实施任务分解

### 阶段 2.1: SVG 图标创建 (0.5h)

**任务**:
1. ✅ 创建 `media/method-badges/` 目录
2. ✅ 生成 7 个 SVG 图标文件（GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS）
3. ✅ 验证 SVG 在 VSCode 中显示正常

**验收**:
- 所有 SVG 文件创建完成
- 颜色、尺寸、圆角符合设计
- 文字居中对齐

### 阶段 2.2: DirectoryTreeProvider 修改 (1h)

**任务**:
1. ✅ 在 `DirectoryTreeProvider` 构造函数中添加 `extensionUri` 参数
2. ✅ 修改 `RequestTreeItem` 类：
   - 移除 `ThemeIcon('circle-filled')` 图标
   - 使用 SVG 图标作为 `iconPath`
   - 移除或保留 `description`（可选）
3. ✅ 添加 `getMethodBadgeIcon()` 工具函数
4. ✅ 更新 `extension.ts` 中的 `DirectoryTreeProvider` 初始化

**关键代码**:
```typescript
class RequestTreeItem extends vscode.TreeItem {
    constructor(
        label: string,
        id: string,
        method: string,
        extensionUri: vscode.Uri
    ) {
        super(label, vscode.TreeItemCollapsibleState.None);
        this.tooltip = `${method} ${label}`;
        this.contextValue = 'request';

        // 使用 SVG 图标
        this.iconPath = getMethodBadgeIcon(method, extensionUri);
        
        // 可选：移除 description 或保留用于其他信息
        // this.description = '';

        // 设置命令
        this.command = {
            command: 'httpClient.loadRequest',
            title: '',
            arguments: [this]
        };
    }
}

function getMethodBadgeIcon(method: string, extensionUri: vscode.Uri): vscode.Uri {
    const methodLower = method.toLowerCase();
    return vscode.Uri.joinPath(extensionUri, 'media', 'method-badges', `${methodLower}.svg`);
}
```

**验收**:
- `RequestTreeItem` 使用 SVG 图标
- 图标正确显示在请求名称左侧
- 点击请求功能正常

### 阶段 2.3: 主题适配 (0.5h)

**任务**:
1. ✅ 测试深色主题下的显示效果
2. ✅ 测试浅色主题下的显示效果
3. ✅ 如需要，调整 SVG 颜色或添加边框

**验收**:
- 深色主题下标签清晰可见
- 浅色主题下标签清晰可见
- 颜色对比度符合无障碍标准

### 阶段 2.4: 功能测试 (0.5h)

**任务**:
1. ✅ 测试点击请求加载功能
2. ✅ 测试右键菜单功能
3. ✅ 测试文件夹展开/折叠
4. ✅ 测试与自动保存功能的兼容性
5. ✅ 测试边界情况（未知方法、长名称等）

**验收**:
- 所有现有功能正常工作
- 无功能回归
- 边界情况处理正确

### 阶段 2.5: 性能测试与优化 (0.5h)

**任务**:
1. ✅ 测试 100+ 请求时的渲染性能
2. ✅ 检查内存占用
3. ✅ 如有性能问题，优化图标加载逻辑

**验收**:
- 大量请求时列表流畅
- 内存占用无异常增长
- 渲染时间增加 < 10%

---

## Phase 3: 测试计划

### 手动测试清单

#### 场景 1: 视觉呈现
- [ ] 所有方法（GET/POST/PUT/DELETE/PATCH/HEAD/OPTIONS）显示正确的彩色标签
- [ ] 标签颜色与参考设计一致
- [ ] 标签圆角、尺寸、间距符合设计
- [ ] 深色主题下清晰可见
- [ ] 浅色主题下清晰可见

#### 场景 2: 功能完整性
- [ ] 点击请求正常加载到右侧面板
- [ ] 右键菜单功能正常（删除、重命名等）
- [ ] 文件夹展开/折叠正常
- [ ] 请求排序正常
- [ ] 与自动保存功能无冲突

#### 场景 3: 边界情况
- [ ] 未知方法类型显示默认样式（灰色）
- [ ] 空文件夹显示正常
- [ ] 长请求名称不影响标签显示
- [ ] 特殊字符请求名称显示正常

#### 场景 4: 性能测试
- [ ] 创建 100+ 请求，列表渲染流畅
- [ ] 快速展开/折叠文件夹无卡顿
- [ ] 内存占用无异常

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| SVG 图标在某些主题下不清晰 | 添加边框；调整颜色对比度 |
| 图标加载影响性能 | 缓存图标路径；延迟加载 |
| 与现有功能冲突 | 详细测试；保持 API 不变 |

---

## 时间估算

| 阶段 | 任务 | 估算时间 |
|------|------|----------|
| Phase 0 | 技术验证 | 0.5h |
| Phase 1 | 设计与准备 | 已完成 |
| Phase 2.1 | SVG 图标创建 | 0.5h |
| Phase 2.2 | DirectoryTreeProvider 修改 | 1h |
| Phase 2.3 | 主题适配 | 0.5h |
| Phase 2.4 | 功能测试 | 0.5h |
| Phase 2.5 | 性能测试与优化 | 0.5h |
| **总计** | | **3.5-4h** |

---

## 下一步行动

1. ✅ 完成 Phase 0 和 Phase 1（本文档已完成）
2. ⏭️ 运行 `/speckit.implement` 开始实施
3. ⏭️ 按 Phase 2.1 → 2.2 → 2.3 → 2.4 → 2.5 顺序执行
4. ⏭️ 每个阶段完成后提交代码

---

## 附录

### A. 相关文件清单
- `src/views/DirectoryTreeProvider.ts` - TreeView 提供者
- `media/method-badges/*.svg` - 方法标签 SVG 图标
- `src/extension.ts` - Extension 初始化

### B. 参考资料
- [VSCode TreeView API](https://code.visualstudio.com/api/extension-guides/tree-view)
- [SVG 基础教程](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial)
- [VSCode 图标指南](https://code.visualstudio.com/api/references/icons-in-labels)
