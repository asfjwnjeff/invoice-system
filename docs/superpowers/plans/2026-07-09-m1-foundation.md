# M1 基础框架 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 搭建发票管理系统的基础框架：项目脚手架、Prisma 数据模型、认证鉴权、RBAC 权限、主数据管理、工作台、文件上传、操作日志、语义层实体定义。

**Architecture:** Next.js App Router + Prisma + PostgreSQL，方案 C（核心模型先行）。先建立完整 Prisma schema（全部核心表），再搭 Auth/RBAC 底座，然后逐模块叠加 CRUD 页面。

**Tech Stack:** Next.js 14+ (App Router), TypeScript strict, Prisma, PostgreSQL, NextAuth.js (Credentials), shadcn/ui, Tailwind CSS, Zod, React Hook Form, TanStack Table, Zustand, TanStack Query

## Global Constraints

- TypeScript strict mode, no `any`
- Immutability: never mutate, always return new objects
- Functions <50 lines, files <800 lines
- All monetary values use `Decimal` type, `tabular-nums` rendering
- Design: Swiss Modern softened (light) + iOS-style (dark)
- Colors: `#F8F7F5` base, `#3D3D3D` primary action, `#3B82F6` accent, `#1C1C1E` dark surface
- Font: Inter (EN/numbers) + Noto Sans SC (ZH), body-base 0.875rem/1.5
- Spacing: 4px grid, radii: 0 (tables) → 4px → 6px → 8px → 12px
- All API routes return `{ success: boolean, data?: T, error?: string }`
- All critical mutations log to `operation_logs` table
- Three business anchors must exist in schema

## File Structure Map

```
/
├── prisma/
│   ├── schema.prisma          # ALL 25+ core tables
│   └── seed.ts                # Demo data (11 users, customers, orgs, orders)
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root: ThemeProvider + SessionProvider
│   │   ├── page.tsx           # Redirect to /dashboard
│   │   ├── globals.css        # Design tokens (Swiss Modern + iOS Dark)
│   │   ├── (auth)/login/page.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx     # Sidebar + Header
│   │   │   └── page.tsx       # Dashboard workbench
│   │   ├── (master-data)/
│   │   │   ├── customers/page.tsx
│   │   │   ├── suppliers/page.tsx
│   │   │   ├── organizations/page.tsx
│   │   │   ├── tax-subjects/page.tsx
│   │   │   ├── invoice-items/page.tsx
│   │   │   └── tax-codes/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── files/route.ts
│   │       ├── customers/route.ts + [id]/route.ts
│   │       ├── suppliers/route.ts + [id]/route.ts
│   │       ├── organizations/route.ts + [id]/route.ts
│   │       ├── tax-subjects/route.ts + [id]/route.ts
│   │       ├── invoice-items/route.ts + [id]/route.ts
│   │       └── tax-codes/route.ts + [id]/route.ts
│   ├── components/
│   │   ├── ui/                # shadcn (auto-generated)
│   │   ├── shared/
│   │   │   ├── data-table.tsx
│   │   │   ├── status-badge.tsx
│   │   │   ├── page-header.tsx
│   │   │   ├── confirm-dialog.tsx
│   │   │   ├── file-upload.tsx
│   │   │   └── empty-state.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── theme-toggle.tsx
│   │   │   └── theme-provider.tsx
│   │   └── dashboard/
│   │       ├── stat-card.tsx
│   │       └── pending-list.tsx
│   ├── lib/
│   │   ├── auth.ts            # NextAuth config
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── api-response.ts    # success()/error() helpers
│   │   ├── validators.ts      # Generic Zod validate<T>()
│   │   └── utils.ts           # cn() helper
│   ├── server/
│   │   ├── services/          # Business logic (one per entity)
│   │   ├── repositories/      # Data access (one per entity)
│   │   └── adapters/
│   │       └── interfaces.ts  # All Mock adapter interfaces
│   ├── semantic/
│   │   ├── entities.json
│   │   ├── attributes.json
│   │   ├── relationships.json
│   │   ├── metrics.json
│   │   ├── dimensions.json
│   │   └── index.ts
│   ├── types/
│   │   ├── index.ts
│   │   └── next-auth.d.ts
│   └── middleware.ts
├── .env.example
├── next.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Phase 1: Project Scaffold & Database

### Task 1: Scaffold Next.js Project

**Creates:** `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `src/app/globals.css`

- [ ] **Step 1:** Run `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --no-turbopack --use-npm`
- [ ] **Step 2:** Install deps:
```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter zod react-hook-form @hookform/resolvers zustand @tanstack/react-table @tanstack/react-query date-fns clsx tailwind-merge lucide-react
npm install -D @types/node tsx
```
- [ ] **Step 3:** `npx shadcn@latest init -d` then `npx shadcn@latest add button input label card table dialog dropdown-menu sheet select checkbox badge separator avatar tabs tooltip toast sonner`
- [ ] **Step 4:** Verify `tsconfig.json` has `"strict": true`, `"noUncheckedIndexedAccess": true`
- [ ] **Step 5:** Create `.env.example`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/invoice_system"
NEXTAUTH_SECRET="change-me-in-production"
NEXTAUTH_URL="http://localhost:3000"
```
- [ ] **Step 6:** Commit: `git add -A && git commit -m "chore: scaffold Next.js project with TypeScript, Tailwind, shadcn/ui"`

---

### Task 2: Prisma Schema — All 25+ Core Tables

**Creates:** `prisma/schema.prisma`, `src/lib/db.ts`

Build the complete Prisma schema from PRD §22 and design spec §2. All enums first (InvoiceDirection, BlueRedFlag, InvoiceCategory, FeeType, AdvanceStatus, AppStatus, RedFlushStatus, VoidStatus, VerifyStatus, DeductStatus, AccountStatus, ArchiveStatus, DeliveryStatus, PayerType, InvoiceStrategy, AdvanceCollectionStatus, WriteOffStatus, SettlementStatus, RiskLevel), then all models.

**Three business anchors must exist:**
- `AdvancePayment.businessOrderId` → `BusinessOrder.id`
- `OutputInvoiceApplication.revenueOrderId` → `RevenueOrder.id`
- `InputInvoice.businessOrderId` → `BusinessOrder.id` + `InputInvoice.costCenterId` → `CostCenter.id`

**Core tables (25+):** organizations, users, tax_subjects, customers, suppliers, invoice_items, tax_codes, business_orders, revenue_orders, cost_centers, advance_payments, output_invoice_applications, output_invoice_application_items, output_invoices, input_invoices, red_flush_applications, void_applications, settlements, customs_payment_books, archive_records, operation_logs, invoice_files, risk_results.

- [ ] **Step 1:** Write `prisma/schema.prisma` — datasource (postgresql), generator (prisma-client-js), all enums, all models with complete fields, relations, and `@@map()` names.
- [ ] **Step 2:** Write `src/lib/db.ts` — Prisma client singleton pattern:
```ts
import { PrismaClient } from "@prisma/client";
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };
export const db = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```
- [ ] **Step 3:** Run `npx prisma generate && npx prisma db push`
- [ ] **Step 4:** Commit: `git add prisma/ src/lib/db.ts && git commit -m "feat: add complete Prisma schema (25+ tables, three anchors)"`

---

### Task 3: Design Tokens — Swiss Modern + iOS Dark

**Modifies:** `src/app/globals.css`, `tailwind.config.ts`

**Light theme:** Base `#F8F7F5`, Surface `#FFFFFF`, Primary text `#1E1E1E`, Secondary `#5C5C5C`, Primary action `#3D3D3D`, Accent `#3B82F6`, Success/Warning/Danger per design spec §4.2.
**Dark theme:** Base `#000000`, Surface `#1C1C1E`, Elevated `#2C2C2E`, Glass `rgba(28,28,30,0.85)`, Accent `#5E9EFF`.

- [ ] **Step 1:** Write `globals.css` — `@import` Inter + Noto Sans SC from Google Fonts. `:root` and `.dark` blocks with all CSS custom properties. Base layer reset: `body` uses `font-family: var(--font-sans)`, 0.875rem/1.5.
- [ ] **Step 2:** Update `tailwind.config.ts` — `darkMode: "class"`, extend theme with `colors` mapped to CSS vars, custom `fontSize` tokens, `fontFamily`, `borderRadius`.
- [ ] **Step 3:** Verify: `npm run dev`, check bg is `#F8F7F5`. Add `class="dark"` to html, check bg is `#000000`.
- [ ] **Step 4:** Commit

---

### Task 4: NextAuth.js + Seed Script

**Creates:** `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/types/next-auth.d.ts`, `src/middleware.ts`, `prisma/seed.ts`

- [ ] **Step 1:** `src/lib/auth.ts` — NextAuth with Credentials provider (plain-text password for prototype). JWT strategy. Callbacks: add `role` + `id` to token/session. `pages: { signIn: "/login" }`.
- [ ] **Step 2:** `src/types/next-auth.d.ts` — Augment `User`, `Session`, `JWT` with `role` and `id`.
- [ ] **Step 3:** `src/app/api/auth/[...nextauth]/route.ts` — `export const { GET, POST } = handlers`.
- [ ] **Step 4:** `src/middleware.ts` — `export { auth as middleware }` with matcher excluding `/api/auth`, `/login`, static files.
- [ ] **Step 5:** `prisma/seed.ts` — Create 11 users (one per role, password = role name + "123"), default organization, 3 sample customers (华为/中芯国际/长鑫), 3 suppliers (顺丰/京东物流/中外运), 4 invoice items, 4 tax codes, 3 cost centers, 1 business order, 1 revenue order.
- [ ] **Step 6:** Add `"prisma": { "seed": "tsx prisma/seed.ts" }` to `package.json`. Run `npx prisma db seed`.
- [ ] **Step 7:** Commit

---

## Phase 2: UI Shell

### Task 5: Login Page

**Creates:** `src/app/(auth)/login/page.tsx`

- [ ] **Step 1:** Write login page — centered Card (400px) on `bg-[var(--color-base)]`. Title "发票管理系统", subtitle. Email + password Inputs. Error state display. Submit Button `bg-primary hover:bg-primary-hover` with loading. On success: `router.push("/dashboard")`.
- [ ] **Step 2:** Test login with `admin@invoice.local` / `admin123`. Expected: redirect to /dashboard.
- [ ] **Step 3:** Commit

---

### Task 6: Theme Provider + App Shell

**Creates:** `src/components/layout/theme-provider.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`, `src/components/layout/theme-toggle.tsx`, `src/app/(dashboard)/layout.tsx`

**Modifies:** `src/app/layout.tsx` (add ThemeProvider + SessionProvider + Toaster)

- [ ] **Step 1:** `theme-provider.tsx` — Client component, ThemeContext with `theme` + `toggleTheme`. Persist to localStorage. Toggle `.dark` on `<html>`.
- [ ] **Step 2:** `sidebar.tsx` — Collapsible (220px/60px). Sections with uppercase tracking-wider labels: "概览" (工作台) + "基础资料" (客户管理/供应商管理/公司主体/税号管理/服务项目/税收分类编码). Active state `bg-muted`. Uses lucide-react icons. Collapse button with ChevronLeft.
- [ ] **Step 3:** `header.tsx` — Session user name, role label (Chinese), Avatar fallback, DropdownMenu with logout. ThemeToggle.
- [ ] **Step 4:** `theme-toggle.tsx` — Sun/Moon icon button.
- [ ] **Step 5:** `(dashboard)/layout.tsx` — `flex h-screen`: sticky Sidebar + flex-1 (Header + scrollable main `p-6`).
- [ ] **Step 6:** Update `src/app/layout.tsx` — `<ThemeProvider><SessionProvider>{children}</SessionProvider><Toaster /></ThemeProvider>`
- [ ] **Step 7:** Commit

---

### Task 7: Dashboard Workbench

**Creates:** `src/app/(dashboard)/page.tsx`, `src/components/dashboard/stat-card.tsx`, `src/components/dashboard/pending-list.tsx`, `src/app/api/dashboard/route.ts`

- [ ] **Step 1:** `stat-card.tsx` — Card with title, large value (`tabular-nums text-2xl font-semibold`), icon (right corner, bg-subtle rounded), optional trend line (green up / red down).
- [ ] **Step 2:** `pending-list.tsx` — Card with linked items: label + count badge (default/warning/danger variants). `hover:bg-subtle`.
- [ ] **Step 3:** `api/dashboard/route.ts` — GET: auth check, query counts from DB (pendingApps, pendingAdvance, pendingRedFlush, pendingVoid, pendingVerify, pendingArchive, highRisks). Return stats array + pendingItems array.
- [ ] **Step 4:** `(dashboard)/page.tsx` — Greeting with session user name. 3-column grid of StatCards. 2-column grid of PendingLists (待办事项 + 快捷入口). TanStack Query for data fetching.
- [ ] **Step 5:** Commit

---

## Phase 3: Shared Components

### Task 8: Reusable Components

**Creates:** `src/components/shared/data-table.tsx`, `src/components/shared/status-badge.tsx`, `src/components/shared/page-header.tsx`, `src/components/shared/confirm-dialog.tsx`, `src/components/shared/empty-state.tsx`

**Creates:** `src/lib/api-response.ts` (helper functions)

- [ ] **Step 1:** `status-badge.tsx` — 5 variants (success/warning/danger/info/neutral). Color-coded with design token colors. `text-body-xs font-medium rounded-subtle`.
- [ ] **Step 2:** `page-header.tsx` — Flex row: left (title h1 + optional description) + right (optional action Button with Plus icon + Link or onClick).
- [ ] **Step 3:** `data-table.tsx` — TanStack Table wrapper. Props: columns, data, searchKey, searchPlaceholder. Features: column sorting, text filter with Search icon Input, pagination (prev/next + page indicator). Table styling: header `text-body-xs uppercase tracking-wider h-10`, body rows `h-11 hover:bg-subtle`, no-data row `h-24 text-center text-text-tertiary`.
- [ ] **Step 4:** `confirm-dialog.tsx` — Dialog wrapper with title, description, cancel + confirm buttons. Danger variant (red confirm button). Loading state.
- [ ] **Step 5:** `empty-state.tsx` — Centered Inbox icon + title + description + optional action slot.
- [ ] **Step 6:** `src/lib/api-response.ts` — `success(data, status?)`, `error(message, status?)`, `notFound()`, `unauthorized()` returning `NextResponse.json(...)`.
- [ ] **Step 7:** Commit

---

### Task 9: File Upload

**Creates:** `src/components/shared/file-upload.tsx`, `src/app/api/files/route.ts`

- [ ] **Step 1:** `api/files/route.ts` — POST: auth check, parse FormData (file, entityType, entityId). Save to `uploads/{entityType}/{UUID}{ext}`. Create `invoice_files` record. Return `{ id, fileName, filePath, fileSize }`.
- [ ] **Step 2:** `file-upload.tsx` — Drop zone with drag-and-drop + file input fallback. `useCallback` for upload with FormData fetch. File list below with FileText icon, name, size, remove button. Props: `entityType`, `entityId?`, `files`, `onChange`, `accept?`, `maxSize?`.
- [ ] **Step 3:** Commit

---

## Phase 4: Master Data CRUD

### Task 10: Foundation — Customers CRUD

**Creates:** `src/lib/validators.ts`, `src/schemas/customer.ts`, `src/server/repositories/customers.ts`, `src/server/services/customers.ts`, `src/app/api/customers/route.ts`, `src/app/api/customers/[id]/route.ts`, `src/app/(master-data)/customers/page.tsx`

**Pattern** (reused for all 6 entities): Schema (Zod) → Repository (Prisma CRUD) → Service (validate + log) → API Route → Page (DataTable + Dialog)

- [ ] **Step 1:** `src/lib/validators.ts` — Generic `validate<T>(schema, input): { success, data?, errors? }`.
- [ ] **Step 2:** `src/schemas/customer.ts` — Zod: name required, taxNo/address/phone/bankName/bankAccount/contactName/contactPhone/email optional, invoiceStrategy enum (default MANUAL), isBlacklisted boolean.
- [ ] **Step 3:** `src/server/repositories/customers.ts` — `findAll({search?, page?, pageSize?})` with OR filter + pagination. `findById`, `create`, `update`, `delete`.
- [ ] **Step 4:** `src/server/services/customers.ts` — Validate → repo → operationLog. All methods take `userId` for logging.
- [ ] **Step 5:** `src/app/api/customers/route.ts` — GET (auth, search params, list). POST (auth, body, create + log).
- [ ] **Step 6:** `src/app/api/customers/[id]/route.ts` — GET (detail), PUT (update + log), DELETE (delete + log).
- [ ] **Step 7:** `src/app/(master-data)/customers/page.tsx` — TanStack Query list. DataTable columns: name (bold), taxNo, contactName, contactPhone, status (StatusBadge), actions (Pencil/Trash2 icons). Create/Edit Dialog: 2-col grid form. Delete: ConfirmDialog. Toast notifications.
- [ ] **Step 8:** Test full CRUD. Commit.

---

### Task 11: Suppliers + Organizations + Tax Subjects + Invoice Items + Tax Codes

Each entity follows Task 10 pattern exactly. Same file structure, same layers.

- [ ] **Step 1: Suppliers** — Extra field `supplierType` enum. Files: schema, repo, service, API route, API [id] route, page.
- [ ] **Step 2: Organizations** — Fields: name, taxNo, address, phone, bankName, bankAccount.
- [ ] **Step 3: Tax Subjects** — Fields: organizationId (Select), name, taxNo, isDefault.
- [ ] **Step 4: Invoice Items** — Fields: name, taxCode, unit, defaultRate (Decimal), feeType (enum).
- [ ] **Step 5: Tax Codes** — Fields: code (unique), name, description.
- [ ] **Step 6:** Test all. Commit.

---

## Phase 5: Semantic Layer & Adapters

### Task 12: Semantic Layer Definitions

**Creates:** `src/semantic/entities.json`, `src/semantic/attributes.json`, `src/semantic/relationships.json`, `src/semantic/metrics.json`, `src/semantic/dimensions.json`, `src/semantic/index.ts`

- [ ] **Step 1:** `entities.json` — 12 entities with name, tableName, aliases[], description, category.
- [ ] **Step 2:** `attributes.json` — Monetary fields with label, aliases, type ("money"), aggregatable/filterable/sortable.
- [ ] **Step 3:** `relationships.json` — 10 edges including three anchors: advance_payments→business_orders, output_invoices→revenue_orders, input_invoices→cost_centers. Each with from, to, type, path[], description.
- [ ] **Step 4:** `metrics.json` — 8 KPIs: 本月开票总额, 可开票余额, 代垫收回率, 进项认证率, 待红冲金额, 订单利润率, 待归档数量, 高风险事项.
- [ ] **Step 5:** `dimensions.json` — time, customer, org, invoiceType, feeType.
- [ ] **Step 6:** `index.ts` — `semanticLayer` object with `findEntity()`, `findMetric()`, `getRelations()`, `getPath()`.
- [ ] **Step 7:** Commit.

---

### Task 13: Adapter Interfaces

**Creates:** `src/server/adapters/interfaces.ts`

- [ ] **Step 1:** Write all TypeScript interfaces for: InvoiceChannelAdapter, TaxVerificationAdapter, CustomsAdapter, DeliveryAdapter, OcrAdapter, ErpAdapter, BankAdapter. Full input/result types. Mock implementations deferred to M2+.
- [ ] **Step 2:** Commit.

---

## Phase 6: Verification

### Task 14: Full Integration Test

- [ ] **Step 1:** Full reset: `npx prisma generate && npx prisma db push --force-reset && npx prisma db seed && npm run dev`
- [ ] **Step 2:** `npx tsc --noEmit` — must pass with 0 errors.
- [ ] **Step 3:** Manual verification:
  - [ ] Login all 11 roles
  - [ ] Dashboard renders stat cards + pending lists
  - [ ] All 6 master data CRUD pages work
  - [ ] File upload creates file in `uploads/`
  - [ ] Theme toggle persists
  - [ ] Sidebar navigates correctly
  - [ ] `/customers` redirects to `/login` when unauthenticated
  - [ ] `operation_logs` table has entries
- [ ] **Step 4:** Fix issues. Tag: `git tag m1-complete`

---

## M1 Completion Criteria

- [ ] `npx tsc --noEmit` passes (strict, 0 errors)
- [ ] Full CRUD on all 6 master data entities
- [ ] Auth works (login, logout, middleware, 11 roles)
- [ ] Theme toggle works (light/dark, persists)
- [ ] Prisma schema has 25+ tables, three anchor FKs
- [ ] Semantic layer JSON loads via `semanticLayer`
- [ ] Adapter interfaces compile
- [ ] Operation logs on all mutations
- [ ] File upload functional

**End of M1 Plan.**
