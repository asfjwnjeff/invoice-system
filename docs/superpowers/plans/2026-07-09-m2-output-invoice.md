# M2 销项与结算 — 实现计划

**Goal:** 实现销项发票完整链路：业务订单 → 费用单 → 结算单 → 开票申请 → 模拟开票 → 模拟交付

**Architecture:** 在 M1 基础上叠加业务模块。收入订单锚点：开票申请必须关联收入订单/结算单。

**Tasks (10):**

### Task 1: Business Orders page + API
- Page: `/business-orders` — DataTable with orderNo, customer, orderType, status
- API: CRUD with `title`, `orderNo`, `orderType`, `customerId`

### Task 2: Fee Items page + API  
- Page: `/fee-items` — linked to business orders
- API: CRUD with `name`, `amount`, `feeType`, `businessOrderId`

### Task 3: Revenue Orders page + API
- Page: `/revenue-orders` — shows availableAmount anchoring to output invoices
- API: CRUD with link to business orders

### Task 4: Settlements page + API
- Page: `/customer-settlements` — settlement list with status tracking
- API: CRUD, link to revenue orders and customers

### Task 5: Output Invoice Applications — list + create
- Page: `/applications` — list with statuses (DRAFT → ISSUED)
- Form: seller/buyer info, invoice type, line items, amounts

### Task 6: Output Invoice Applications — detail + approval workflow
- Detail page: `/applications/[id]` — view items, status timeline
- Actions: submit for approval, approve, reject

### Task 7: Mock Invoice Issuing
- Mock adapter: generates fake invoice number, tax flow number
- Status transition: PENDING_ISSUE → ISSUING → ISSUED
- Mock PDF generation placeholder

### Task 8: Mock Invoice Delivery
- Delivery status tracking
- Mock email/QR code delivery simulation

### Task 9: Output Invoices list + detail
- Page: `/invoices` — all issued invoices
- Detail: `/invoices/[id]` — invoice data + delivery status

### Task 10: Navigation update + M2 verification
- Add M2 pages to sidebar
- End-to-end flow test
