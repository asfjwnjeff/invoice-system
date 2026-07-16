# 半导体供应链服务商发票管理系统 PRD v2.0

> **版本**: v2.0 | **日期**: 2026-07-16 | **状态**: 现状文档（记录已实现功能）

---

## 目录

1. [产品定位](#1-产品定位)
2. [核心业务流程](#2-核心业务流程)
3. [系统边界与外部集成](#3-系统边界与外部集成)
4. [技术栈](#4-技术栈)
5. [系统架构](#5-系统架构)
6. [功能模块清单](#6-功能模块清单)
7. [数据模型](#7-数据模型)
8. [API 端点](#8-api-端点)
9. [状态机](#9-状态机)
10. [Mock 与真实数据边界](#10-mock-与真实数据边界)
11. [待确认事项](#11-待确认事项)

---

## 1. 产品定位

**发票管理模块**，面向半导体供应链服务行业，覆盖 **业、票、财、税、档案** 全链路。

- **定位**: 企业内部发票管理中台（非单一开票工具）
- **形态**: 高保真原型 — 不连接真实税局生产环境，但数据模型/状态机/API 边界按生产级设计
- **用户角色**: 系统管理员、财务主管、开票员、应收会计、应付会计、税务专员、关务专员、仓储专员、运输专员、业务经理、审计员（共 11 个角色）

### 核心设计原则

1. **三大业务锚点**: 代垫↔业务订单、销项发票↔收入订单、进项发票↔成本对象
2. **四级金额校验**: 收入订单 ≥ 结算单 ≥ 开票申请 ≥ 销项发票
3. **全链路可追溯**: 每张发票可追溯到业务订单→收入订单→结算单→开票申请→预制发票
4. **状态机驱动**: 开票申请、红冲、作废、代垫均通过状态机流转

---

## 2. 核心业务流程

### 2.1 销项发票正向开票流程

```
┌─ CBMS（本系统）─────────────────────────────────────────┐
│                                                          │
│  ① 收入录入 → ② 创建凭证 → ③ 发起开票申请               │
│       ↓                                                  │
│  ④ 开票专员审核（通过/驳回）                              │
│       ↓ [驳回则返回修改]                                  │
│       ↓ [通过]                                           │
│  ⑤ 生成预制发票                                          │
│       ↓                                                  │
│  ⑥ 一审（单票）/ 二审（批量）                            │
│       ↓                                                  │
│  ⑦ 推送至艾特票(Atpiao)                                 │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         ↓
┌─ 艾特票(Atpiao) — 外部系统 ─────────────────────────────┐
│                                                          │
│  ⑧ 校验开票信息 → 选票种 → 导入明细 → 校验税收分类编码    │
│  ⑨ 填充客户要求备注                                       │
│  ⑩ 推送税局开票                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         ↓
┌─ 税局 — 外部系统 ───────────────────────────────────────┐
│                                                          │
│  ⑪ 税局完成开票                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘
                         ↓
┌─ CBMS（本系统）— 发票回传 ──────────────────────────────┐
│                                                          │
│  ⑫ 已开发票同步回本系统                                   │
│       ├── A. 推送至 CBMS，完成单据-发票关联               │
│       └── B. 系统自动发送邮件通知申请人                   │
│                                                          │
│  ✅ 正向开票流程完成                                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**关键决策**: 预制发票在本系统内完成审核后，推送给艾特票。艾特票负责与税局对接。税局开票完成后，发票直接同步回本系统（非通过链票）。

### 2.2 红冲流程

```
① 录入红字确认单
      ↓
② 选择被红冲的蓝字发票
      ↓
③ 同时校验两个条件：
   ├── 条件一: 查验结果 = "查验成功"
   └── 条件二: 业务状态 ∈ {已作废, 已红冲, 已查验}
      ↓
   ┌── 两个条件均满足 → ④ 发起红冲 → ⑤ 开具红字发票
   └── 任一条件不满足 → ❌ 不能发起，需先完成查验或处理业务状态
```

**红冲状态机**: 草稿 → 待审批 → 待确认单 → 待对方确认 → 已确认 → 红冲开具中 → 红冲已开具 → 完成

**关键规则**:
- 红字确认单有 72 小时确认窗口超时
- 支持全额红冲和部分红冲
- 红冲后可选择是否重新开票

### 2.3 成本录入流程

```
F01 财务模块：
  ① 录入成本 → ② 上传对应发票 → ③ 关联业务订单/供应商/成本中心
      ↓
C01 发票登记：
  ④ 发票登记 → ⑤ 查验去重 → ⑥ 认证抵扣
      ↓
✅ 成本录入完成
```

**补充环节**（进项发票模块支持）:
- OCR 上传识别
- 供应商匹配
- 业务订单匹配
- 成本分摊（按比例或固定金额）
- 代垫成本标记
- 付款申请

### 2.4 代垫管理流程

```
业务事件发生 → 创建代垫单 → 上传附件
    → 财务确认 → 客户确认
    → 录入结算 → 生成发票或付款通知单
    → 客户付款 → 收款核销 → 归档
```

**六种开票策略**: 不开票、单独开票、合并服务费开票、仅服务费开票、净额开票、人工处理

### 2.5 作废流程

- **申请作废**: 开票申请 → 作废审批
- **历史发票作废**: 已开发票 → 作废申请 → 执行
- **代办发票作废**: 代垫发票 → 作废条件校验 → 执行

---

## 3. 系统边界与外部集成

| 系统 | 关系 | 职责 |
|------|------|------|
| **CBMS（本系统）** | 内部 | 收入/成本录入、开票申请、预制发票审核、发票管理、红冲、作废、归档 |
| **艾特票(Atpiao)** | 外部 | 接收审核后的预制发票 → 校验税编/税率 → 推送税局开票 |
| **税局** | 外部 | 实际开票（本系统不直连，通过艾特票中转） |
| ~~链票~~ | ~~不涉及~~ | 当前流程中发票从税局直接同步回本系统，不经过链票 |

---

## 4. 技术栈

| 层 | 技术 | 版本 |
|---|---|---|
| 框架 | Next.js App Router (Turbopack) | 16.2.10 |
| 语言 | TypeScript (strict mode) | ^5 |
| UI 组件 | shadcn/ui | ^4.13 |
| 样式 | Tailwind CSS | v4 |
| 表格 | TanStack Table + TanStack Query | v8 / v5 |
| 表单 | React Hook Form + Zod | ^7.81 / v4.4 |
| 状态管理 | Zustand | v5 |
| Toast | Sonner (top-center) | v2 |
| ORM | Prisma | 5.22 |
| 数据库 | SQLite (dev.db) | — |
| 鉴权 | NextAuth.js v5 (Credentials, JWT) | 5.0.0-beta.31 |
| 设计 | Swiss Modern light + iOS-style dark | — |

---

## 5. 系统架构

### 5.1 分层架构

```
┌─────────────────────────────────────────────┐
│  页面层 (27 pages)                          │
│  src/app/(app)/**/page.tsx                  │
│  useState form + TanStack Query + Dialog    │
├─────────────────────────────────────────────┤
│  组件层 (24 components)                     │
│  shared/ (7) + layout/ (5) + ui/ (17)      │
├─────────────────────────────────────────────┤
│  API 层 (57 endpoints)                      │
│  RESTful: GET/POST/PUT/DELETE + batch/select│
├─────────────────────────────────────────────┤
│  服务层 (5 services)                        │
│  advance, approval, business, customers,    │
│  master-data                                │
├─────────────────────────────────────────────┤
│  数据层                                      │
│  Prisma ORM → SQLite (dev.db)               │
│  38 数据模型                                 │
└─────────────────────────────────────────────┘
```

### 5.2 Provider 嵌套

```
<html lang="zh-CN">
  <head> Inter + Noto Sans SC (Google Fonts) </head>
  <body>
    ThemeProvider → SessionProvider → TooltipProvider → QueryProvider
    ├── Sidebar + Header + <main> (页面内容)
    └── <Toaster position="top-center" />
  </body>
</html>
```

### 5.3 页面 CRUD 模式

```tsx
// 所有 CRUD 页面统一模式
const [editId, setEditId] = useState<string|null>(null);
const [f, setF] = useState({...});         // 表单状态
const { data } = useQuery({...});           // 数据获取
const sm = useMutation({ onSuccess: () => toast.success("已保存") });
const dm = useMutation({ onSuccess: () => toast.success("已删除") });
// 所有 mutation onError → toast.error
```

### 5.4 服务层模式

```ts
// 通用 Service Factory
createService(entity, schema, searchFields, extraData?, include?)
// 自动生成: list(search), getById, create, update, delete
// operationLog.create 统一 try-catch 包裹
```

### 5.5 API 响应格式

```typescript
// 成功: { success: true, data: T }
// 失败: { success: false, error: string }
// 工具函数: success(), error(), notFound(), unauthorized()
```

---

## 6. 功能模块清单

### 6.1 概览

| 页面 | 路由 | 功能 |
|------|------|------|
| 工作台 | `/dashboard` | 4 统计卡片（待审批申请、待一审预票、待红冲、待查验进项）+ 7 步流程引导 + 快捷入口 |

### 6.2 业务管理

| 页面 | 路由 | 功能 |
|------|------|------|
| 收入订单 | `/revenue-orders` | 列表/详情/CRUD，关联业务订单和客户，可开票金额追踪 |
| 业务订单 | `/business-orders` | 列表/详情/编辑/CRUD，四大金额汇总，关联收入/代垫/进项/费用 |
| 费用管理 | `/fee-items` | 列表/CRUD，关联业务订单 |
| 客户结算 | `/customer-settlements` | 列表/详情/CRUD，关联收入订单，批量生成开票申请 |

### 6.3 销项发票

| 页面 | 路由 | 功能 |
|------|------|------|
| 开票申请 | `/applications` | 列表/新建/详情/编辑/CRUD，关联结算单或收入订单 |
| 预制发票 | `/pre-invoices` | 列表/新建/详情，一审/二审，推送艾特票 |
| 销项发票管理 | `/invoices` | 列表/新建/详情/编辑/CRUD，查验状态/交付状态/使用状态追踪 |

**销项发票列表页批量操作**:
- 从税局拉取新发票（sync-from-tax）
- 批量同步至税局
- 批量通知申请人
- 批量归档

**销项发票详情页功能**:
- 发票信息卡片（含不含税金额、税额、价税合计、税率）
- 状态信息卡片（查验结果、交付状态、邮件送达、使用状态）
- 金额汇总卡片
- 发票预览抽屉
- 同步/通知/归档按钮（Toast 反馈）

### 6.4 红冲作废

| 页面 | 路由 | 功能 |
|------|------|------|
| 红冲管理 | `/red-flush` | 列表/新建红冲申请，关联蓝票，条件校验，状态追踪 |

### 6.5 进项归档

| 页面 | 路由 | 功能 |
|------|------|------|
| 进项发票 | `/input-invoices` | 列表/手工录入/编辑/详情，OCR 上传，批量查验，状态过滤（查验/认证/抬头校验），成本分摊，代垫标记 |
| 成本录入 | `/cost-entry` | 列表/CRUD，F01/C01 状态追踪，关联业务订单/供应商/成本中心 |

### 6.6 审批中心

| 页面 | 路由 | 功能 |
|------|------|------|
| 审批中心 | `/approvals` | 待审批/已审批列表，通过/驳回操作，审批意见填写，批量通过 |

**审批工作流特性**:
- 多级角色审批（按角色匹配审批步骤）
- 金额阈值触发不同审批级别
- 审批记录完整追溯
- WorkflowDefinition → WorkflowInstance → ApprovalRecord 三层模型

### 6.7 主数据

| 页面 | 路由 | 功能 |
|------|------|------|
| 客户管理 | `/master-data/customers` | CRUD，开票策略，黑名单标记 |
| 供应商管理 | `/master-data/suppliers` | CRUD，供应商类型，黑名单标记 |
| 组织管理 | `/master-data/organizations` | CRUD，层级结构 |
| 税号管理 | `/master-data/tax-subjects` | CRUD，银行账户管理，默认税号标记 |
| 服务项目管理 | `/master-data/invoice-items` | CRUD，关联税收编码 |
| 税收编码管理 | `/master-data/tax-codes` | CRUD，税率配置 |

### 6.8 风控报表

| 页面 | 路由 | 功能 |
|------|------|------|
| 风控中心 | `/risk-reports/risk-center` | 风险规则运行结果列表，风险等级分类 |
| 报表分析 | `/risk-reports/reports` | KPI 指标展示 |

### 6.9 共享组件

| 组件 | 功能 |
|------|------|
| **DataTable** | 搜索过滤、分页、多选复选框+批量操作栏、列设置面板（拖拽排序/置顶/显示隐藏）、粘性右侧列、行选中高亮 |
| **PageHeader** | 页面标题 + 描述 + 操作按钮 |
| **StatusBadge** | 5 种状态变体: success/warning/danger/info/neutral |
| **ConfirmDialog** | 确认/取消弹窗，支持 danger 变体和 loading 状态 |
| **EmptyState** | 空数据占位，带 Inbox 图标 + 可选操作 |
| **FileUpload** | 拖拽/点击上传，POST /api/files |
| **InvoicePreviewDrawer** | 右侧滑出面板，标签切换（PDF/OFD/XML），占位预览 |

---

## 7. 数据模型

### 7.1 模型总览（38 个）

#### 基础数据（7）
| 模型 | 用途 |
|------|------|
| Organization | 组织架构，支持层级 |
| User | 用户，11 角色 |
| TaxSubject | 税务主体，含银行账户 |
| Customer | 客户，开票策略 + 黑名单 |
| Supplier | 供应商，类型 + 黑名单 |
| InvoiceItem | 服务项目，关联税收编码 |
| TaxCode | 税收分类编码 + 税率 |

#### 业务域（5）
| 模型 | 用途 |
|------|------|
| BusinessOrder | 内部业务订单（核心锚点），四大金额汇总 |
| RevenueOrder | 收入订单，可开票金额追踪 |
| FeeItem | 费用项 |
| CostCenter | 成本中心，层级结构 |
| AdvancePayment | 代垫单，收款/核销状态，六种开票策略 |

#### 结算域（2）
| 模型 | 用途 |
|------|------|
| Settlement | 结算单，关联收入订单 |
| SettlementItem | 结算明细，关联费用项/代垫单 |

#### 销项管线（6）
| 模型 | 用途 |
|------|------|
| OutputInvoiceApplication | 开票申请 |
| OutputInvoiceApplicationItem | 申请明细 |
| PreInvoice | 预制发票 |
| PreInvoiceItem | 预制发票明细 |
| OutputInvoice | 销项发票（正式） |
| OutputInvoiceItem | 销项发票明细 |

#### 进项域（2）
| 模型 | 用途 |
|------|------|
| InputInvoice | 进项发票，成本分摊/代垫标记 |
| InputInvoiceItem | 进项发票明细 |

#### 红冲/作废（4）
| 模型 | 用途 |
|------|------|
| RedFlushApplication | 红冲申请 |
| RedFlushItem | 红冲明细 |
| RedConfirmationForm | 红字确认单，72h 超时 |
| VoidApplication | 作废申请 |

#### 支撑域（12）
| 模型 | 用途 |
|------|------|
| CustomsPaymentBook | 海关缴款书 |
| InvoiceFile | 发票文件（OFD/PDF/XML） |
| InvoiceDeliveryRecord | 交付记录（邮件/下载/打印） |
| InvoiceVerifyRecord | 查验记录 |
| ArchiveRecord | 电子档案 |
| OperationLog | 操作日志 |
| RiskResult | 风控结果 |
| WorkflowDefinition | 审批流程定义 |
| WorkflowInstance | 审批流程实例 |
| ApprovalRecord | 审批记录 |
| TaxSubjectBankAccount | 税务主体银行账户 |
| CostEntry | 成本录入（F01/C01 状态） |

### 7.2 核心数据关系

```
BusinessOrder (业务订单)
  ├── 1:N → AdvancePayment (代垫单)
  ├── 1:N → RevenueOrder (收入订单)
  ├── 1:N → InputInvoice (进项发票)
  └── 1:N → FeeItem (费用项)

RevenueOrder → 1:N → Settlement (结算单)
Settlement → 1:N → OutputInvoiceApplication (开票申请)
OutputInvoiceApplication → 1:N → PreInvoice (预制发票)
PreInvoice → 1:1 → OutputInvoice (销项发票)
OutputInvoice → 1:1 → RedFlushApplication (红冲)

AdvancePayment → N:1 → CustomsPaymentBook (海关缴款书)
InputInvoice → N:1 → CostCenter (成本中心)
InputInvoice → N:1 → Supplier (供应商)
```

---

## 8. API 端点

### 8.1 端点统计

| 类别 | 数量 |
|------|------|
| 资源目录 | 20 |
| route.ts 文件 | 57 |
| 常规 CRUD | GET/POST 列表 + GET/PUT/DELETE 单体 |
| Select 下拉 | 9 个实体 |
| 批量操作 | batch-archive, batch-notify, batch-sync-tax, batch-verify, batch-approve, batch-invoice |
| 子资源动作 | issue, push-tax, review, sync-tax, notify-applicant |

### 8.2 端点清单

| 实体 | 端点 |
|------|------|
| 客户 | `customers/`, `[id]`, `select` |
| 供应商 | `suppliers/`, `[id]`, `select` |
| 业务订单 | `business-orders/`, `[id]`, `select` |
| 收入订单 | `revenue-orders/`, `[id]`, `select` |
| 费用项 | `fee-items/`, `[id]` |
| 结算单 | `settlements/`, `[id]`, `select`, `batch-invoice` |
| 开票申请 | `applications/`, `[id]`, `[id]/issue` |
| 预制发票 | `pre-invoices/`, `[id]`, `select`, `[id]/push-tax`, `[id]/review` |
| 销项发票 | `invoices/`, `[id]`, `[id]/push`, `[id]/sync-tax`, `[id]/notify-applicant`, `batch-archive`, `batch-notify`, `batch-sync-tax`, `sync-from-tax`, `output-invoices/select` |
| 进项发票 | `input-invoices/`, `[id]`, `batch-verify` |
| 成本录入 | `cost-entries/`, `[id]`, `select` |
| 红冲 | `red-flush/`, `[id]` |
| 审批 | `approvals/`, `[id]`, `batch` |
| 服务项目 | `invoice-items/`, `[id]` |
| 税收编码 | `tax-codes/`, `[id]` |
| 税号 | `tax-subjects/`, `[id]`, `select`, `[id]/bank-accounts` |
| 成本中心 | `cost-centers/select` |
| 文件 | `files/` |
| 认证 | `auth/[...nextauth]` |

---

## 9. 状态机

### 9.1 开票申请状态

```
DRAFT → READY → PENDING_APPROVAL → APPROVED → PENDING_ISSUE → ISSUING → ISSUED → DELIVERED
                       ↓
                   REJECTED → (修改后重新提交)
```

### 9.2 红冲状态

```
DRAFT → PENDING_APPROVAL → PENDING_CONFIRM_FORM → WAITING_COUNTERPART_CONFIRM
    → CONFIRMED → RED_ISSUING → RED_ISSUED → COMPLETED
    (72h 超时自动失效)
```

### 9.3 作废状态

```
DRAFT → PENDING_APPROVAL → APPROVED → EXECUTED
```

### 9.4 代垫状态

```
DRAFT → PENDING_CONFIRM → CONFIRMED → PENDING_COLLECTION
    → PARTIALLY_COLLECTED → COLLECTED → WRITTEN_OFF
    (可分支 DISPUTED)
```

---

## 10. Mock 与真实数据边界

### 10.1 Mock 功能

| 功能 | Mock 方式 |
|------|----------|
| 税局发票同步 | `POST /api/invoices/sync-from-tax` — 随机生成 1-2 张模拟发票 |
| 批量同步税局 | `POST /api/invoices/batch-sync-tax` — 模拟同步 |
| 批量通知 | `POST /api/invoices/batch-notify` — 模拟邮件通知 |
| 批量归档 | `POST /api/invoices/batch-archive` — 模拟归档 |
| 批量查验 | `POST /api/input-invoices/batch-verify` — 模拟查验结果 |
| 开票申请→发票 | `POST /api/applications/[id]/issue` — 生成模拟发票号和税局流水号 |
| 审批工作流 | 角色匹配基于 mock 用户，不连真实 OA |
| 用户认证 | NextAuth.js Credentials，3 个 mock 用户（非数据库 User 表） |

### 10.2 真实种子数据

`prisma/seed.ts` 填充以下真实数据：
- 组织、税号、客户、供应商、服务项目、税收编码
- 5 个业务订单（含费用项、代垫单、收入订单的完整关联）
- 12 个收入订单
- 进项发票、风控结果

**数据重置命令**: `rm -f prisma/dev.db && npx prisma db push && npx tsx prisma/seed.ts`

---

## 11. 待确认事项

> 以下事项需要用户逐一确认或补充说明。

### 11.1 业务流程

- [ ] **预制发票→艾特票推送接口**: 当前 Mock 实现了 `push-tax` 端点，实际对接艾特票的接口规范是什么？需要哪些字段映射？
- [ ] **税局发票回传**: 税局开票完成后，"直接同步回本系统"的具体方式是什么？是 API 回调还是定时拉取？当前用 `sync-from-tax` Mock 随机生成。
- [ ] **红冲条件校验**: 当前实现了两个条件（查验成功 + 业务状态），是否有其他校验条件？比如购方是否已抵扣？
- [ ] **成本分摊规则**: 进项发票的成本分摊目前支持按比例（costAllocationRatio），是否需要支持按金额分摊？是否需要多成本中心分摊？

### 11.2 系统功能

- [ ] **代垫管理页面**: 侧边栏有"代垫管理"菜单项，但当前没有对应的页面文件。是否需要实现？
- [ ] **海关票据页面**: 同上，侧边栏有"海关票据"菜单但无页面。是否需要实现？
- [ ] **作废管理页面**: 侧边栏有"红冲管理"但没有"作废管理"。作废申请的管理页面是否需要？
- [ ] **风控中心/报表分析**: 当前页面内容为基础占位，具体需要哪些风控规则和报表指标？

### 11.3 数据与权限

- [ ] **用户-组织关联**: 当前 Mock 用户没有关联真实 Organization，所有数据 `organizationId = "org-default"`。生产环境是否需要多组织隔离？
- [ ] **角色权限矩阵**: 当前 11 个角色，审批工作流通过角色名匹配。需要定义每个角色在各模块的权限（查看/编辑/删除/审批）吗？
- [ ] **发票号规则**: 当前 Mock 生成 `INV-` 前缀的随机号，真实发票号的编码规则是什么？

### 11.4 界面与体验

- [ ] **侧边栏菜单完整性**: 当前侧边栏 5 个分组 12 个菜单项，但主数据管理（客户/供应商/组织/税号/服务项目/税收编码）未出现在侧边栏。是否需要补充入口？
- [ ] **深色模式侧边栏**: 当前浅色模式下侧边栏使用深色背景（`#1C1C24`），这是有意的设计选择还是需要调整为浅色？
- [ ] **移动端适配**: 当前系统设计为桌面端使用，是否需要适配移动端？

---

> **文档维护**: 此 PRD 为现状文档。如需添加新功能或修改流程，请更新本文档并递增版本号。
