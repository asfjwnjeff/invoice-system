# 半导体供应链服务商发票管理系统

面向半导体行业的发票管理模块，覆盖**业、票、财、税、档案**全链路。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16.2 (App Router, Turbopack) |
| 语言 | TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v4 |
| 表格 | TanStack Table v8 + TanStack Query v5 |
| 表单 | React Hook Form + Zod v4 |
| 状态 | Zustand v5 |
| Toast | Sonner v2 (top-center) |
| ORM | Prisma 5.22 |
| 数据库 | SQLite (dev.db) |
| 鉴权 | NextAuth.js v5 (Credentials, JWT, mock auth) |
| 设计 | Swiss Modern light + iOS-style dark |

## 本地运行

```bash
npm run dev              # 启动开发服务器 (http://localhost:3000)
npx prisma db push       # 同步 schema 到 SQLite
npx tsx prisma/seed.ts   # 填充种子数据
npx prisma studio        # 打开 Prisma 数据浏览器
```

**登录凭据：** `admin@invoice.local` / `admin123`（共 3 个 mock 角色用户，见 `src/lib/auth.ts`）

**类型检查：** 提交前务必运行 `npx tsc --noEmit`（`next dev` 不做全量检查，`.next/` 目录错误可忽略）

## 目录结构

```
src/
  app/                    # Next.js App Router 页面
    layout.tsx            # 根布局：Theme → Session → Tooltip → Query → Toaster
    (app)/                # 认证后页面组（共享 Sidebar + Header 布局）
      dashboard/          # 首页工作台（4 统计卡片 + 流程引导）
      (business)/         # 业务订单、收入订单、费用、结算、开票申请、销项发票、预制发票
      (advance)/          # 代垫管理、海关票据
      (red-void)/         # 红冲管理、作废管理
      (input-archive)/    # 进项发票、OCR、成本录入、付款申请、电子档案
      (workflow)/         # 审批中心（多级角色审批工作流）
      (master-data)/      # 客户、供应商、组织、税号、服务项目、税收编码
      (risk-reports)/     # 风控中心、报表分析
  components/
    layout/               # Sidebar, Header, QueryProvider, ThemeProvider, ThemeToggle
    shared/               # DataTable, PageHeader, StatusBadge, ConfirmDialog, EmptyState, FileUpload, InvoicePreviewDrawer
    ui/                   # 17 个 shadcn/ui 组件 (Button, Input, Select, Dialog, Tabs, Sheet, Tooltip, Sonner 等)
  lib/                    # auth, db, api-response, validators, utils
    hooks/                # useEntitySelect（5 分钟缓存的下拉选项 hook）
  server/services/        # 业务服务层 (advance, approval, business, customers, master-data)
  semantic/               # 语义层 (entities.json, relationships.json, metrics.json)
  schemas/                # Zod 校验 schema (advance, business, customer, master-data)
prisma/
  schema.prisma           # 30 个数据模型
  seed.ts                 # 种子数据
render.yaml               # Render 部署配置 (free plan, SQLite 临时数据库)
```

## 核心架构模式

### Provider 嵌套顺序
```
<html lang="zh-CN" suppressHydrationWarning>
  <head> Google Fonts (Inter + Noto Sans SC) </head>
  <body className="antialiased">
    ThemeProvider → SessionProvider → TooltipProvider → QueryProvider → children
    <Toaster /> (top-center, 自定义 Lucide 图标)
```

### 页面模式：useState form + TanStack Query CRUD + Dialog 编辑 + Toast 反馈

几乎所有 CRUD 页面使用同一模式：
```tsx
const [editId, setEditId] = useState<string|null>(null);
const [f, setF] = useState({...});  // 表单状态
const { data } = useQuery(...);      // 数据获取
const sm = useMutation(...);         // 创建/更新 (onSuccess: toast.success)
const dm = useMutation(...);         // 删除 (onSuccess: toast.success)
// 所有 mutation 的 onError 统一 toast.error
```

### 服务层：通用 Service Factory + include 参数
```ts
// src/server/services/business.ts
createService(entity, schema, searchFields, extraData?, include?)
// 自动支持 CRUD + 关联查询 + 操作日志（try-catch 包裹防 P2003 外键错误）
// 同模式：advance.ts 的 crudService(), master-data.ts 的 createService()
```

### 语义层：JSON 元数据驱动
- `entities.json`: 22 个业务实体定义（含别名、分类）
- `relationships.json`: 23 条实体关系
- `metrics.json`: 10 个 KPI 指标公式
- `index.ts`: `findEntity()`, `findMetric()`, `getRelations()` 查询函数

### API 模式
- RESTful: `GET/POST /api/[entity]`, `GET/PUT/DELETE /api/[entity]/[id]`
- 统一定义: `import { auth } from '@/lib/auth'`, `return success(data)` / `return error(msg, code)` / `notFound()` / `unauthorized()`
- 实体选择器: `/api/[entity]/select` → `{items: [{id, label}]}` 供 Select 下拉框使用
- 批量操作: `/api/[entity]/batch-{action}` POST
- 子资源动作: `/api/[entity]/[id]/{action}` POST
- 20 个 API 资源目录，共 68 个端点

### 通用 Hook
- `useEntitySelect(endpoint)` → 获取实体下拉选项（queryKey: `["select", endpoint]`，5 分钟 staleTime）

### DataTable 功能
- 搜索过滤（`searchKey` prop）、分页（上/下页 + 页码）
- 多选复选框 + 批量操作栏（蓝色高亮 "已选 N 项"）
- 列设置面板：拖拽排序、置顶/取消置顶、显示/隐藏切换
- 粘性右侧列（`stickyRightColumns` prop）
- 行选中高亮：`bg-blue-100 dark:bg-blue-900/40`

### Toast 通知
- Sonner 统一挂载在根 layout，`position="top-center"`
- 22+ 页面使用 `toast.success()` / `toast.error()` 模式
- mutation 的 `onSuccess` / `onError` 回调统一 toast

## 关键数据关系

```
内部业务订单 (BusinessOrder)
  ├── 1:N → 代垫单 (AdvancePayment)       # 订单产生代垫
  ├── 1:N → 收入订单 (RevenueOrder)        # 订单定义收入
  ├── 1:N → 进项发票 (InputInvoice)        # 订单归集成本
  └── 1:N → 费用项 (FeeItem)              # 订单产生费用

收入订单 → 结算单 → 开票申请 → 预制发票 → 销项发票    # 收入→开票管线
进项发票 → 成本中心 / 供应商 / 成本录入               # 成本归集
```

## 注意事项

- **不要创建 middleware.ts**（Turbopack edge runtime 与 Prisma 冲突）
- **Select 组件**：SelectItem 使用 `value` prop（不是 `itemValue`）
- **CSS 字体**：Google Fonts 通过 `<link>` 标签加载（非 CSS @import）
- **数据库重置**：`rm -f prisma/dev.db && npx prisma db push && npx tsx prisma/seed.ts`
- **端口占用**：如 3000 被占用会自动切到 3001
- **TS 检查**：`next dev` 不做全量类型检查，提交前跑 `npx tsc --noEmit`（过滤 `.next/` 目录错误）
- **operationLog**：所有 `operationLog.create` 必须用 try-catch 包裹（mock user id 可能不匹配真实 User 表，导致 P2003 外键约束错误）
- **Zod v4**：`ZodError.issues`（不是 `.errors`），`ZodType` 无 `.partial()` 方法（需 `as unknown as { partial: () => ZodSchema }` 转换）
- **TS strict mode**：`unknown` 类型不能直接作为 ReactNode，使用 `!!value && <Component>` 模式
- **数字金额列**：使用 `tabular-nums` CSS class 对齐
- **种子数据类型**：`Decimal` 字段传 `number`，`DateTime?` 字段需 `null` check
