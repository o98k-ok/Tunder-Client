# 左侧请求列表 UI 重构 - 任务清单

**Feature**: 左侧请求列表 UI 重构  
**Branch**: feature/20251011-sidebar-refactor  
**Estimated Time**: 3.5-4h

---

## 任务执行流程

### Phase 2.1: SVG 图标创建 (0.5h)

#### Task 2.1.1: 创建图标目录
- **ID**: SVG-001
- **描述**: 创建 `media/method-badges/` 目录
- **文件**: 新建目录
- **依赖**: 无
- **验收**: 
  - [ ] 目录已创建
- **优先级**: P0 (必须)

#### Task 2.1.2: 创建 GET 方法 SVG 图标
- **ID**: SVG-002
- **描述**: 创建绿色 GET 标签 SVG 图标
- **文件**: `media/method-badges/get.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #73BF69 (绿色)
  - [ ] 尺寸: 40x18px
  - [ ] 圆角: 3px
  - [ ] 文字: GET, 白色, Arial, 11px, bold, 居中
- **优先级**: P0 (必须)

#### Task 2.1.3: 创建 POST 方法 SVG 图标
- **ID**: SVG-003
- **描述**: 创建蓝色 POST 标签 SVG 图标
- **文件**: `media/method-badges/post.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #4A90E2 (蓝色)
  - [ ] 尺寸: 45x18px
  - [ ] 圆角: 3px
  - [ ] 文字: POST, 白色, Arial, 11px, bold, 居中
- **优先级**: P0 (必须)

#### Task 2.1.4: 创建 PUT 方法 SVG 图标
- **ID**: SVG-004
- **描述**: 创建橙色 PUT 标签 SVG 图标
- **文件**: `media/method-badges/put.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #E8A434 (橙色)
  - [ ] 尺寸: 40x18px
  - [ ] 圆角: 3px
  - [ ] 文字: PUT, 白色, Arial, 11px, bold, 居中
- **优先级**: P0 (必须)

#### Task 2.1.5: 创建 DELETE 方法 SVG 图标
- **ID**: SVG-005
- **描述**: 创建红色 DELETE 标签 SVG 图标
- **文件**: `media/method-badges/delete.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #F44747 (红色)
  - [ ] 尺寸: 55x18px
  - [ ] 圆角: 3px
  - [ ] 文字: DELETE, 白色, Arial, 11px, bold, 居中
- **优先级**: P0 (必须)

#### Task 2.1.6: 创建 PATCH 方法 SVG 图标
- **ID**: SVG-006
- **描述**: 创建黄色 PATCH 标签 SVG 图标
- **文件**: `media/method-badges/patch.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #FFCC00 (黄色)
  - [ ] 尺寸: 50x18px
  - [ ] 圆角: 3px
  - [ ] 文字: PATCH, 白色, Arial, 11px, bold, 居中
- **优先级**: P0 (必须)

#### Task 2.1.7: 创建 HEAD 方法 SVG 图标
- **ID**: SVG-007
- **描述**: 创建紫色 HEAD 标签 SVG 图标
- **文件**: `media/method-badges/head.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #C586C0 (紫色)
  - [ ] 尺寸: 45x18px
  - [ ] 圆角: 3px
  - [ ] 文字: HEAD, 白色, Arial, 11px, bold, 居中
- **优先级**: P1 (重要)

#### Task 2.1.8: 创建 OPTIONS 方法 SVG 图标
- **ID**: SVG-008
- **描述**: 创建灰色 OPTIONS 标签 SVG 图标
- **文件**: `media/method-badges/options.svg`
- **依赖**: SVG-001
- **验收**:
  - [ ] 颜色: #858585 (灰色)
  - [ ] 尺寸: 60x18px
  - [ ] 圆角: 3px
  - [ ] 文字: OPTIONS, 白色, Arial, 11px, bold, 居中
- **优先级**: P1 (重要)

---

### Phase 2.2: DirectoryTreeProvider 修改 (1h)

#### Task 2.2.1: 添加 extensionUri 参数
- **ID**: CODE-001
- **描述**: 在 `DirectoryTreeProvider` 构造函数中添加 `extensionUri` 参数
- **文件**: `src/views/DirectoryTreeProvider.ts`
- **依赖**: 无
- **验收**:
  - [ ] 构造函数接受 `extensionUri: vscode.Uri` 参数
  - [ ] 保存为类成员变量
- **优先级**: P0 (必须)

#### Task 2.2.2: 添加图标路径工具函数
- **ID**: CODE-002
- **描述**: 添加 `getMethodBadgeIcon()` 函数
- **文件**: `src/views/DirectoryTreeProvider.ts`
- **依赖**: CODE-001
- **验收**:
  - [ ] 函数接受 `method` 和 `extensionUri` 参数
  - [ ] 返回对应方法的 SVG 图标路径
  - [ ] 处理未知方法（返回默认图标）
- **优先级**: P0 (必须)

#### Task 2.2.3: 修改 RequestTreeItem 使用 SVG 图标
- **ID**: CODE-003
- **描述**: 修改 `RequestTreeItem` 类使用 SVG 图标替代 ThemeIcon
- **文件**: `src/views/DirectoryTreeProvider.ts`
- **依赖**: CODE-002
- **验收**:
  - [ ] 移除 `ThemeIcon('circle-filled')` 代码
  - [ ] 使用 `getMethodBadgeIcon()` 设置 `iconPath`
  - [ ] 保持 `command` 和 `contextValue` 不变
- **优先级**: P0 (必须)

#### Task 2.2.4: 更新 Extension 初始化
- **ID**: CODE-004
- **描述**: 在 `extension.ts` 中传递 `extensionUri` 给 `DirectoryTreeProvider`
- **文件**: `src/extension.ts`
- **依赖**: CODE-001
- **验收**:
  - [ ] 创建 `DirectoryTreeProvider` 时传递 `context.extensionUri`
  - [ ] 编译无错误
- **优先级**: P0 (必须)

---

### Phase 2.3: 主题适配测试 (0.5h)

#### Task 2.3.1: 深色主题测试
- **ID**: TEST-001
- **描述**: 在深色主题下测试 SVG 图标显示效果
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 所有方法标签清晰可见
  - [ ] 颜色对比度足够
  - [ ] 无视觉异常
- **优先级**: P0 (必须)

#### Task 2.3.2: 浅色主题测试
- **ID**: TEST-002
- **描述**: 在浅色主题下测试 SVG 图标显示效果
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 所有方法标签清晰可见
  - [ ] 颜色对比度足够
  - [ ] 无视觉异常
- **优先级**: P0 (必须)

#### Task 2.3.3: 高对比度主题测试
- **ID**: TEST-003
- **描述**: 在高对比度主题下测试显示效果
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 标签清晰可见
  - [ ] 符合无障碍标准
- **优先级**: P1 (重要)

---

### Phase 2.4: 功能完整性测试 (0.5h)

#### Task 2.4.1: 点击加载功能测试
- **ID**: TEST-004
- **描述**: 测试点击请求是否正常加载到右侧面板
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 点击请求触发 `httpClient.loadRequest` 命令
  - [ ] 请求数据正确加载到面板
  - [ ] 无错误日志
- **优先级**: P0 (必须)

#### Task 2.4.2: 右键菜单功能测试
- **ID**: TEST-005
- **描述**: 测试右键菜单功能是否正常
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 右键菜单正常弹出
  - [ ] 删除、重命名等功能正常
- **优先级**: P0 (必须)

#### Task 2.4.3: 文件夹功能测试
- **ID**: TEST-006
- **描述**: 测试文件夹展开/折叠功能
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 文件夹图标未改变
  - [ ] 展开/折叠功能正常
  - [ ] 子请求显示正常
- **优先级**: P0 (必须)

#### Task 2.4.4: 自动保存兼容性测试
- **ID**: TEST-007
- **描述**: 测试与自动保存功能的兼容性
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 修改请求后自动保存正常
  - [ ] 保存状态指示器正常
  - [ ] 无功能冲突
- **优先级**: P0 (必须)

#### Task 2.4.5: 边界情况测试
- **ID**: TEST-008
- **描述**: 测试边界情况处理
- **依赖**: 所有 CODE 任务
- **验收**:
  - [ ] 未知方法类型显示默认图标
  - [ ] 空文件夹显示正常
  - [ ] 长请求名称显示正常
  - [ ] 特殊字符名称显示正常
- **优先级**: P1 (重要)

---

### Phase 2.5: 性能测试与优化 (0.5h)

#### Task 2.5.1: 大量请求性能测试
- **ID**: PERF-001
- **描述**: 测试 100+ 请求时的渲染性能
- **依赖**: 所有 CODE 和 TEST 任务
- **验收**:
  - [ ] 列表渲染流畅，无明显卡顿
  - [ ] 展开/折叠响应及时
  - [ ] 滚动流畅
- **优先级**: P0 (必须)

#### Task 2.5.2: 内存占用测试
- **ID**: PERF-002
- **描述**: 检查内存占用是否正常
- **依赖**: 所有 CODE 和 TEST 任务
- **验收**:
  - [ ] 内存占用无异常增长
  - [ ] 长时间使用无内存泄漏
- **优先级**: P1 (重要)

#### Task 2.5.3: 性能优化（如需要）
- **ID**: PERF-003
- **描述**: 如发现性能问题，进行优化
- **依赖**: PERF-001, PERF-002
- **验收**:
  - [ ] 渲染时间增加 < 10%
  - [ ] 无明显性能回归
- **优先级**: P1 (重要)

#### Task 2.5.4: 代码审查与清理
- **ID**: PERF-004
- **描述**: 审查代码，移除调试日志，优化代码结构
- **依赖**: 所有任务
- **验收**:
  - [ ] 移除调试 `console.log`
  - [ ] 代码格式规范
  - [ ] 添加必要注释
- **优先级**: P1 (重要)

#### Task 2.5.5: 编译和 Lint 检查
- **ID**: PERF-005
- **描述**: 编译 TypeScript 并修复 Lint 错误
- **依赖**: PERF-004
- **验收**:
  - [ ] 运行 `npm run compile`，无编译错误
  - [ ] 无 Lint 警告或错误
- **优先级**: P0 (必须)

---

## 任务统计

- **总任务数**: 26
- **P0 (必须)**: 20
- **P1 (重要)**: 6

---

## 执行顺序

1. **Phase 2.1** (可并行): SVG-001 → (SVG-002 到 SVG-008 并行创建)
2. **Phase 2.2** (顺序执行): CODE-001 → CODE-002 → CODE-003 → CODE-004
3. **Phase 2.3** (可并行): TEST-001, TEST-002, TEST-003
4. **Phase 2.4** (顺序执行): TEST-004 → TEST-005 → TEST-006 → TEST-007 → TEST-008
5. **Phase 2.5** (顺序执行): PERF-001 → PERF-002 → PERF-003 → PERF-004 → PERF-005

---

## 完成标准

所有 P0 任务的验收标准全部通过，P1 任务可选但建议完成。

