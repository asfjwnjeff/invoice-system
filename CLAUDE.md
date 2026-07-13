# 半导体供应链服务商发票管理系统

面向半导体行业的发票管理中台原型，覆盖**业、票、财、税、档案**全链路。

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16.2 (App Router, Turbopack) |
| 语言 | TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v4 |
| 表格 | TanStack Table + TanStack Query |
| 表单 | React Hook Form + Zod |
| ORM | Prisma 5.22 |
| 数据库 | SQLite (dev.db) |
| 鉴权 | NextAuth.js v5 (Credentials, mock auth) |
| 设计 | Swiss Modern light + iOS-style dark |

## 本地运行

```bash
npm run dev              # 启动开发服务器 (http://localhost:3000)
npx prisma db push       # 同步 schema 到 SQLite
npx tsx prisma/seed.ts   # 填充种子数据
npx prisma studio        # 打开 Prisma 数据浏览器
```

**登录凭据：** `admin@invoice.local` / `admin123`（共 11 个角色用户，见 seed.ts）

## 目录结构

```
src/
  app/                    # Next.js App Router 页面
    (app)/                # 认证后页面组（共享 Sidebar + Header 布局）
      dashboard/          # 首页工作台
      (business)/         # 业务订单、收入订单、费用、结算、发票、开票申请
      (advance)/          # 代垫管理、海关票据
      (red-void)/         # 红冲管理、作废管理
      (input-archive)/    # 进项发票、OCR、付款申请、电子档案
      (workflow)/         # 审批中心
      (master-data)/      # 客户、供应商、组织、税号、服务项目、税收编码
      (risk-reports)/     # 风控中心、报表分析
  components/
    layout/               # Sidebar, Header, QueryProvider
    shared/               # DataTable, PageHeader, StatusBadge, ConfirmDialog
    ui/                   # shadcn/ui 组件 (Button, Input, Select, Dialog 等)
  lib/                    # auth, db, api-response, hooks
  server/services/        # 业务服务层 (business, advance, approval, master-data)
  semantic/               # 语义层 (entities.json, relationships.json, metrics.json)
  schemas/                # Zod 校验 schema
prisma/
  schema.prisma           # 34 个数据模型
  seed.ts                 # 种子数据（5 业务订单 + 12 收入订单 + 完整管线）
```

## 核心架构模式

### 页面模式：useState form + TanStack Query CRUD + Dialog 编辑

几乎所有 CRUD 页面使用同一模式：
```tsx
const [editId, setEditId] = useState<string|null>(null);
const [f, setF] = useState({...});  // 表单状态
const { data } = useQuery(...);      // 数据获取
const sm = useMutation(...);         // 创建/更新
const dm = useMutation(...);         // 删除
```

### 服务层：通用 Service Factory + include 参数
```ts
// src/server/services/business.ts
createService(entity, schema, searchFields, extraData?, include?)
// 自动支持 CRUD + 关联查询 + 操作日志
```

### 语义层：JSON 元数据驱动
- `entities.json`: 22 个业务实体定义（含别名、分类）
- `relationships.json`: 22 条实体关系
- `metrics.json`: 10 个 KPI 指标公式
- `index.ts`: `findEntity()`, `findMetric()`, `getRelations()` 查询函数

### API 模式
- RESTful: `GET/POST /api/[entity]`, `GET/PUT/DELETE /api/[entity]/[id]`
- 统一定义: `import { auth } from '@/lib/auth'`, `return success(data)` / `return error(msg, code)`
- 实体选择器: `/api/[entity]/select` → `{items: [{id, label}]}` 供 Select 下拉框使用

### 通用 Hook
- `useEntitySelect(endpoint)` → 获取实体下拉选项（5 分钟缓存）

## 关键数据关系

```
内部业务订单 (BusinessOrder)
  ├── 1:N → 代垫单 (AdvancePayment)       # 订单产生代垫
  ├── 1:N → 收入订单 (RevenueOrder)        # 订单定义收入
  ├── 1:N → 进项发票 (InputInvoice)        # 订单归集成本
  └── 1:N → 费用项 (FeeItem)              # 订单产生费用

收入订单 → 结算单 → 开票申请 → 销项发票    # 收入→开票管线
进项发票 → 成本中心 / 供应商               # 成本归集
```

## 注意事项

- **不要创建 middleware.ts**（Turbopack edge runtime 与 Prisma 冲突）
- **Select 组件**：SelectItem 使用 `value` prop（不是 `itemValue`）
- **CSS 字体**：Google Fonts 通过 `<link>` 标签加载（非 CSS @import）
- **数据库重置**：`rm -f prisma/dev.db && npx prisma db push && npx tsx prisma/seed.ts`
- **端口占用**：如 3000 被占用会自动切到 3001
