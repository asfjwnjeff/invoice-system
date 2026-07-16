# B端列表页设计标准

> 基准页面：`代垫管理` (`advance-payments`) — 2026-07-16 确认

---

## 1. 页面结构

```
┌─────────────────────────────────────────────────────┐
│  PageHeader                                          │
│  ┌──────────────────────┐              ┌──────────┐ │
│  │ 标题 + 描述          │              │ 新增按钮  │ │
│  └──────────────────────┘              └──────────┘ │
├─────────────────────────────────────────────────────┤
│  筛选栏                                              │
│  ┌────────────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌──┐ ┌──┐ │
│  │ 筛选设置    │ │字段1│ │字段2│ │字段3│ │查│ │重│ │
│  │ (FilterPnl) │ │  ▽  │ │  ▽  │ │  ▽  │ │询│ │置│ │
│  └────────────┘ └─────┘ └─────┘ └─────┘ └──┘ └──┘ │
├─────────────────────────────────────────────────────┤
│  表格工具栏                           ┌──────────┐  │
│  ┌──────────────┐                     │ 列设置    │  │
│  │ 搜索框       │                     └──────────┘  │
│  └──────────────┘                                   │
├─────────────────────────────────────────────────────┤
│  表格 (DataTable)                                    │
│  ┌─┬──────┬────┬──────┬────┬──────┬──────┬──────┐  │
│  │☐│单号  │状态│公司  │区域│供应商│金额  │...   │  │
│  ├─┼──────┼────┼──────┼────┼──────┼──────┼──────┤  │
│  │☐│P-... │已收│泓明  │CAN │联邦...│188.89│...   │  │
│  └─┴──────┴────┴──────┴────┴──────┴──────┴──────┘  │
│  共 N 条           ◀ 1 / M ▶                        │
│                              查看 编辑 🗑            │  ← 操作列固定在右侧
└─────────────────────────────────────────────────────┘
```

## 2. 组件清单

| 组件 | 文件 | 用途 |
|------|------|------|
| `PageHeader` | `shared/page-header.tsx` | 页面标题 + 新增按钮 |
| `FilterPanel` | `shared/filter-panel.tsx` | 筛选字段自定义（显示/隐藏/排序） |
| `SelectSearch` | `ui/select-search.tsx` | 可搜索下拉（>10选项必用） |
| `DataTable` | `shared/data-table.tsx` | 表格：搜索/分页/多选/列设置/固定列 |
| `FormDialog` | `shared/form-dialog.tsx` | 新增/编辑/查看弹窗 |
| `FormField` | `shared/form-dialog.tsx` | 表单字段包装（标签+必填标记） |
| `StatusBadge` | `shared/status-badge.tsx` | 状态标签（5色） |
| `ConfirmDialog` | `shared/confirm-dialog.tsx` | 删除确认弹窗 |

## 3. 筛选栏规范

### 3.1 布局
- 一行 `flex flex-wrap items-center gap-2`
- 每个筛选字段：`<label> <SelectSearch>`
- 标签字体：`text-sm text-muted-foreground`
- 查询/重置按钮在右侧，竖线分隔 `border-l border-border`

### 3.2 查询逻辑
- 筛选值存入临时 state (`orgF`, `zoneF` 等)
- 点击「查询」才写入 `applied` state
- 表格按 `applied` 过滤
- 「重置」清空所有临时值和 applied

### 3.3 FilterPanel
- 齿轮按钮 `Settings2` icon + "筛选设置 (N)"
- 弹出面板列出所有可选筛选字段
- 每行：拖拽手柄 + 勾选框 + 字段名 + 上下箭头
- 配置持久化到 `localStorage`（按 `storageKey` 区分页面）
- SSR 安全：useState 初始用默认值，useEffect 中从 localStorage 读取

### 3.4 筛选控件类型选择

| 字段类型 | 控件 | 何时使用 |
|---------|------|---------|
| 枚举（<10项） | `Select` | 如状态、币种 |
| 枚举（>10项） | `SelectSearch` | 如公司、供应商、区域 |
| 关键字 | `Input` (搜索框) | 如单号、提单号 |

## 4. 表格规范

### 4.1 DataTable Props
- `selectable` — 多选复选框
- `selectedIds` / `onSelectionChange` — 受控选中
- `searchKey` — 搜索字段名
- `searchPlaceholder` — 搜索框占位文字
- `stickyRightColumns={["act"]}` — 操作列固定在右侧

### 4.2 表头
- `h-10 text-xs font-semibold bg-muted text-foreground uppercase tracking-wider`
- 复选框列头也加 `bg-muted`

### 4.3 体行
- 高度 `h-11`
- 选中行蓝色高亮：`bg-blue-100 dark:bg-blue-900/40`
- 金额列 `tabular-nums` 数字等宽

### 4.4 列设置面板

DataTable 内置，无需额外代码。工具栏右侧显示「列设置」按钮，点击弹出面板。

**功能：**
- **拖拽排序** — 拖动手柄 `GripVertical` 调整列的顺序
- **显示/隐藏** — 勾选框切换列的可见性
- **置顶/取消置顶** — Pin 图标将列固定在表格左侧
- **上下箭头** — 精确调整列顺序
- **重置** — 一键恢复默认列顺序和可见性

**使用方式：**
```tsx
// DataTable 会自动渲染列设置按钮（只要有可隐藏的列）
// 无需额外 props
<DataTable columns={cols} data={items} />
```

**列定义配置：**
```tsx
// 列的 id 不等于 "act" 或 "sel" 时自动进入列设置面板
{ id: "act", header: "操作", meta: { headerClassName: "text-center" }, ... }
// act/sel 列被排除在列设置面板外
```

### 4.4 列设置面板

### 4.5 操作列
- Header 居中：`meta: { headerClassName: "text-center" }`
- 三个按钮：查看(ghost) / 编辑(ghost+pencil) / 删除(ghost+destructive)
- 大小 `h-8`，间距 `flex gap-1`

## 5. 表单弹窗规范

### 5.1 FormDialog Props
- `width="2xl"` 默认宽度 672px
- `title` 三种模式：`viewMode ? "查看" : editId ? "编辑" : "新增"`
- `loading` — 保存按钮 loading 态
- `onSubmit` — 查看模式不触发保存

### 5.2 表单布局
- `grid grid-cols-2 gap-x-8 gap-y-6`
- 标签与输入间距 `mb-2.5`（10px）
- 长字段 `fullWidth` → `col-span-2`
- 必填字段 `required` → 红色星号

### 5.3 只读模式
- `<fieldset disabled={viewMode} className="contents">` 包裹所有字段
- 自然禁用内部 Input/Select/SelectSearch

### 5.4 删除确认
```tsx
<ConfirmDialog
  open={!!deleteId}
  title="确认删除"
  description="确认要删除吗？此操作不可撤销。"
  confirmLabel="删除"
  variant="danger"
/>
```

## 6. 状态管理

```
useState 清单:
  open          — 弹窗开关
  editId        — 编辑记录 ID（null=新增）
  viewMode      — 查看模式（只读）
  selected      — 表格多选 ID[]
  f             — 表单字段
  orgF/zoneF/...— 筛选临时值
  applied       — 筛选生效值（点查询才更新）
  filterOrder   — 筛选字段可见/顺序（配合 FilterPanel）
  deleteId      — 删除确认目标
```

## 7. 数据流

```
GET /api/entity → useQuery → data.items → 筛选 + DataTable
                              ↓
  POST/PUT /api/entity → useMutation → toast.success → invalidateQueries
                              ↓
  DELETE /api/entity/[id] → useMutation → toast.success → invalidateQueries
```

## 8. 快速检查清单

- [ ] 筛选标签 `text-sm`（非 `text-xs`）
- [ ] 10+ 选项用 `SelectSearch`
- [ ] 表头 `bg-muted` + `font-semibold`
- [ ] 操作列 `stickyRightColumns + meta.headerClassName: "text-center"`
- [ ] 查看/编辑/删除三按钮
- [ ] 弹窗 `width="2xl"`，`grid-cols-2 gap-x-8 gap-y-6`
- [ ] 标签 `mb-2.5`
- [ ] 必填 `required` 红星
- [ ] 只读 `fieldset disabled`
- [ ] 筛选「查询」才生效，「重置」清空
- [ ] 多选 `selectable`
- [ ] FilterPanel `localStorage` 持久化、SSR 安全
