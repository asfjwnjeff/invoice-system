# 半导体供应链服务商发票管理系统 — 设计文档

**版本：** v1.0
**日期：** 2026-07-09
**定位：** 高质量原型级开发（非生产，功能完备）

---

## 1. 产品定位

面向半导体供应链服务商的发票中台原型，覆盖**业、票、财、税、档案**全链路。

```text
业务订单 → 费用发生 → 代垫归集 → 客户结算 → 开票申请 → 开票 → 交付 → 红冲/作废 → 收款核销 → 入账 → 归档
```

---

## 2. 架构决策

### 2.1 开发策略：方案 C — 核心模型先行 + 功能螺旋

| 决策 | 内容 |
|------|------|
| **策略** | 先搭数据模型、状态机、适配器、权限底座，功能模块以最短可用路径逐个叠加 |
| **理由** | 发票系统核心在状态机正确性而非页面数量；底座不稳后期返工代价大 |
| **节奏** | 前 2-3 天不产出页面（专注模型），之后每轮螺旋交付完整可用功能 |

### 2.2 三大业务锚点（业财税一体化骨架）

```text
内部业务订单 ──锚点1──→ 代垫单    （代垫必须关联订单，订单关闭前校验核销）
内部业务订单 ──锚点2──→ 收入订单  （销项开票来源于收入，三层金额校验）
内部业务订单 ──锚点3──→ 成本对象  （进项发票归集到成本，支撑利润分析）
```

### 2.3 语义层（AI 就绪）

在数据库与消费者之间架设语义层，包含实体字典、字段字典、关系图谱、指标定义、维度定义。使 AI Agent 能够理解自然语言查询。

```text
原始数据 → 语义层 (entities/attributes/relationships/metrics/dimensions) → REST API / AI Agent / Report Engine
```

### 2.4 四状态机

1. 开票申请状态机（草稿 → 待审批 → 待开票 → 开票中 → 已开票 → 已交付）
2. 红冲状态机（含红字确认单 72 小时生命周期）
3. 作废状态机（开票申请取消 / 传统票据作废 / 代开发票作废）
4. 代垫状态机（含收款、核销、争议）

---

## 3. 技术栈

| 层 | 选择 |
|------|------|
| 框架 | Next.js App Router |
| UI | shadcn/ui + Tailwind CSS |
| 表格 | TanStack Table |
| 表单 | React Hook Form + Zod |
| 状态 | Zustand + TanStack Query |
| API | Next.js Route Handlers (REST, Mock 实现) |
| ORM | Prisma |
| 数据库 | PostgreSQL |
| 鉴权 | NextAuth.js |
| 权限 | RBAC + 数据权限 |
| PDF | React PDF (模拟票面) |
| 语言 | TypeScript (strict) |

---

## 4. 设计系统

### 4.1 总体方向

**Swiss Modern 软化版 + iOS 风格深色模式**

- 浅色：Swiss 网格系统 + 字体层级 + 克制用色，但降对比度（暖灰底 + 近黑文字）
- 深色：iOS HIG 深色逻辑（纯黑底 + 层级毛玻璃 + 高饱和补偿色）

### 4.2 色彩

#### 浅色模式

```
Base (页面底)          #F8F7F5  暖灰白
Surface (卡片/表格)     #FFFFFF
Subtle (侧边栏)        #F1F0ED
Primary 文字           #1E1E1E
Secondary 文字         #5C5C5C
主操作 (石墨)           #3D3D3D
高亮引导 (Accent)      #3B82F6  仅关键 CTA
成功                  #059669
警告                  #D97706
错误/危险              #DC2626
```

#### 深色模式

```
Base                   #000000  iOS 基准黑
Surface               #1C1C1E  iOS 系统卡片
Elevated              #2C2C2E  iOS 弹窗层
Glass                 rgba(28,28,30,0.85) + blur
Primary 文字           #FFFFFF
Secondary 文字         #98989D  iOS 次级
Accent               #5E9EFF  iOS Blue
```

### 4.3 字体

- 中文：思源黑体 / Noto Sans SC
- 英文/数字：Inter（tabular-nums 用于金额列）
- 层级：Display (2.75-3.5rem) → Heading (1.125-1.75rem) → Body (0.75-1rem) → Label (0.6875-0.75rem)

### 4.4 间距与圆角

- 间距：4px 基准网格，1 (4px) ~ 10 (64px)
- 圆角：0（表格）→ 4px（按钮/输入框）→ 6px（卡片）→ 8px（弹窗）→ 12px（看板卡片）
- Swiss 基因：表格零圆角，数字右对齐，无彩开关

### 4.5 组件体系

- 按钮四级填充度：Fill → Outline → Ghost → 纯文字
- 表格：44/48px 行高，表头全大写，底边分割
- 表单：两列网格，focus 无发光 ring，金额右对齐千分位
- 弹窗/抽屉：浅色白色底，深色 iOS Elevated/Surface

---

## 5. 里程碑

| 阶段 | 内容 | 产出 |
|------|------|------|
| **M1** 基础框架 | 登录权限、工作台、客户/供应商/主体/税号、服务项目/税编、文件上传、操作日志、语义层实体定义 | 框架可运行 |
| **M2** 销项结算 | 业务订单、费用单、结算单、开票申请、模拟开票、模拟交付、收入订单锚点 | 销项闭环 |
| **M3** 代垫关务 | 代垫单、海关缴款书、报关单关联、代垫进入结算、收款核销、订单锚点 | 代垫闭环 |
| **M4** 红冲作废 | 红冲申请、红字确认单、红字发票模拟、错票重开、作废申请/审批 | 纠错闭环 |
| **M5** 进项归档 | 进项录入、Mock OCR/查验、认证模拟、入账、成本归集锚点、电子档案 | 进项闭环 |
| **M6** 风控报表 | 风控规则、风险中心、销项/进项/代垫/海关台账、订单利润率报表、AI 查询接口 | 完整系统 |

---

## 6. API 接口策略

- 所有核心操作通过 REST API 完成
- 外部依赖（税务通道、查验、交付、海关、OCR、ERP）均使用 Mock Adapter
- 接口签名按真实系统设计，Adapter 可替换为真实实现
- 语义层 `/api/semantic/query` 接口预留 AI 自然语言查询

---

## 7. 目录结构

```text
/src
  /app                    # Next.js App Router 页面
  /components
    /ui                   # shadcn/ui 基础组件
    /shared               # 业务共享组件（表格、表单、状态标签等）
  /features
    /output-invoice       # 销项发票
    /input-invoice        # 进项发票
    /advance-payment      # 代垫管理
    /red-flush            # 红冲管理
    /void                 # 作废管理
    /customs              # 海关票据
    /settlement           # 结算单
    /archive              # 电子档案
    /risk                 # 风控中心
    /reports              # 报表分析
    /dashboard            # 工作台
    /settings             # 系统设置
  /server
    /services             # 业务领域服务
    /repositories         # 数据访问层
    /adapters             # Mock 适配器（可替换为真实实现）
    /workflows            # 状态机 / 审批流引擎
    /validators           # 校验规则
  /semantic               # 语义层
    entities.json
    attributes.json
    relationships.json
    metrics.json
    dimensions.json
    synonyms.json
    index.ts
  /lib
    /auth
    /db
    /permissions
    /money                # 金额计算
    /tax                  # 税率计算
    /files
  /types
  /constants
  /schemas                # Zod 校验 schema
```

---

## 8. 关键约束

| 约束 | 要求 |
|------|------|
| 不可变性 | 所有状态变更创建新对象，不修改现有对象 |
| 文件大小 | 函数 <50 行，文件 <800 行 |
| 类型安全 | TypeScript strict，不做 any |
| 测试 | 核心状态机 100% 覆盖，业务逻辑 80%+ |
| Mock | 所有外部接口可替换，Mock 行为可配置 |
| 金额 | 统一使用 tabular-nums，Decimal 类型，避免浮点误差 |
| 日志 | 所有关键操作不可删除 |
