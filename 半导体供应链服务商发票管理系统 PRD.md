# 半导体供应链服务商发票管理系统 PRD

**版本：** v1.0
**定位：** 高质量原型级开发，不对接真实税务生产环境，但功能、流程、数据结构、接口边界尽量接近成熟发票系统
**适用行业：** 半导体供应链服务、进出口代理、关务服务、仓储服务、运输服务、代垫费用结算、综合物流服务
**技术方向：** Next.js + API Stub + 模拟税务通道 + 可扩展接口层
**编写日期：** 2026-07-09

---

## 1. 项目背景

公司作为半导体行业供应链服务商，业务涉及进口、出口、关务、仓储、运输、报关、商检、垫付税费、垫付运杂费、服务费结算等多个环节。现有发票业务通常存在以下问题：

1. 业务单据、费用明细、发票、客户结算之间关联弱。
2. 代垫费用和服务费混在一起，容易出现开票口径不清。
3. 进项票、销项票、海关缴款书、运输票、仓储票分散管理。
4. 红冲、作废、重开缺少流程化控制。
5. 发票查验、重复报销、异常抬头、税率错误等依赖人工。
6. 财务、业务、关务、仓储、运输之间信息割裂。
7. 对未来数电票、乐企直连、ERP、WMS、TMS、关务系统、财务系统对接缺少统一接口层。

国家税务总局对数电发票的定义中明确，数电发票是票面要素数字化、发票号码全国统一赋予、开票额度智能授予、信息通过税务数字账户流转的新型发票，并与纸质发票具有同等法律效力；数电发票类别包括电子发票（增值税专用发票）、电子发票（普通发票）、航空运输电子客票行程单、铁路电子客票、机动车销售统一发票、二手车销售统一发票等。

因此，本系统目标不是只做“开票工具”，而是建设一个覆盖**业、票、财、税、档案**的发票管理中台原型。

---

## 2. 项目目标

### 2.1 产品目标

建设一个面向半导体供应链业务的发票系统，实现以下能力：

1. 支持业务单据驱动开票。
2. 支持服务费、仓储费、运输费、关务费、代垫费等多费用类型管理。
3. 支持销项发票申请、开具模拟、交付、红冲、作废、重开。
4. 支持进项发票采集、OCR 模拟、查验模拟、认证状态模拟、入账归档。
5. 支持海关进口增值税专用缴款书、关税缴款书等关务相关票据管理。
6. 支持代垫费用从发生、归集、客户确认、收款、开票策略到核销的完整链路。
7. 支持发票与客户订单、报关单、仓储单、运输单、费用单、结算单、收付款单关联。
8. 支持风控规则，包括重复开票、重复报销、金额不一致、抬头错误、税率异常、红冲超额等。
9. 支持电子档案归档，保留发票文件、业务附件、审批记录、操作日志。
10. 预留真实税务、ERP、WMS、TMS、关务系统、银行流水、邮件/短信等接口。

### 2.2 原型级目标

本项目为“高质量原型级开发”，要求：

| 项目          | 要求                        |
| ----------- | ------------------------- |
| 真实税务对接      | 不做真实对接，仅保留接口和 Mock        |
| 真实发票开具      | 不实际开具，仅模拟开票结果             |
| 数电票/OFD/PDF | 可生成模拟版式文件，不具备真实法律效力       |
| 查验          | 使用 Mock 查验接口，返回模拟真伪和风险状态  |
| 红冲          | 完整模拟红字确认单、红字发票流程          |
| 作废          | 完整模拟传统票据作废和未开票申请取消        |
| 权限          | 按真实系统标准设计                 |
| 数据          | 按真实业务字段设计                 |
| UI          | 接近可售卖产品级别                 |
| 接口          | 使用真实 REST API 结构，后续可替换适配器 |

---

## 3. 设计原则

1. **发票不是孤立对象**：必须和业务单据、费用、结算、收付款关联。
2. **代垫费用单独建模**：代垫不是普通收入，必须独立于服务费管理。
3. **红冲优先于作废**：对数电票场景，已开具后发生销售退回、开票有误、服务中止、销售折让等，应走红字发票流程。
4. **作废仅用于特定模拟场景**：包括传统增值税发票、代开发票、未正式开具的开票申请取消等。
5. **进销项分离，统一票池**：销项、进项、海关票据、代垫票据统一进入发票池，但业务流程分离。
6. **接口先行**：即使暂不对接，也要设计真实接口边界。
7. **状态机驱动**：发票状态、交付状态、红冲状态、入账状态、归档状态必须独立管理。
8. **可演示、可扩展、可替换**：前期 Mock，后期可替换为真实适配器。

---

## 4. 业务范围

### 4.1 本期包含范围

| 模块             | 是否包含 |
| -------------- | ---- |
| 首页工作台          | 包含   |
| 基础资料           | 包含   |
| 客户/供应商管理       | 包含   |
| 商品/服务项目/税收分类编码 | 包含   |
| 业务单据管理         | 包含   |
| 费用项管理          | 包含   |
| 代垫费用管理         | 包含   |
| 销项发票管理         | 包含   |
| 进项发票管理         | 包含   |
| 海关票据管理         | 包含   |
| 红冲管理           | 包含   |
| 作废管理           | 包含   |
| 发票查验 Mock      | 包含   |
| 发票交付 Mock      | 包含   |
| 电子档案           | 包含   |
| 风控规则           | 包含   |
| 报表分析           | 包含   |
| 系统设置           | 包含   |
| API Stub       | 包含   |

### 4.2 本期不包含范围

| 模块          | 说明                 |
| ----------- | ------------------ |
| 真实税务开票      | 不对接真实税务平台          |
| 真实乐企直连      | 仅预留接口              |
| 真实银行流水      | 仅预留接口              |
| 真实邮件/短信     | 可模拟发送状态            |
| 真实 OCR      | 可先用手工录入或 Mock OCR  |
| 真实 OFD 法定文件 | 仅生成模拟 PDF/OFD 占位文件 |
| 真实电子签章      | 不做真实 CA 签章         |
| 真实纳税申报      | 仅做数据看板，不生成真实申报文件   |

---

## 5. 用户角色与权限

### 5.1 角色定义

| 角色       | 使用场景           | 核心权限        |
| -------- | -------------- | ----------- |
| 系统管理员    | 配置组织、角色、接口、字典  | 全部权限        |
| 财务主管     | 审批开票、红冲、作废、入账  | 审批、复核、报表    |
| 开票员      | 处理开票申请         | 创建、编辑、提交开票  |
| 应收会计     | 销项、客户结算、收款核销   | 销项发票、结算单    |
| 应付会计     | 进项、供应商发票、付款    | 进项发票、认证、付款  |
| 税务专员     | 查验、认证、税务风险     | 查验、认证、税务看板  |
| 关务专员     | 报关单、海关缴款书、进口税费 | 关务票据、代垫     |
| 仓储专员     | 仓储费用、入库/出库关联   | 仓储业务单       |
| 运输专员     | 运输费用、运输单关联     | 运输业务单       |
| 业务员/客户经理 | 发起开票、查看客户结算    | 开票申请、客户维度查询 |
| 审计员      | 查看日志、档案、风险记录   | 只读、导出       |

### 5.2 权限维度

1. 菜单权限。
2. 按钮权限。
3. 数据权限。
4. 组织权限。
5. 客户权限。
6. 税号权限。
7. 票种权限。
8. 金额权限。
9. 审批权限。
10. 导出权限。

---

## 6. 核心业务对象

### 6.1 业务对象总览

| 对象    | 说明                  |
| ----- | ------------------- |
| 客户    | 委托公司提供供应链服务的客户      |
| 供应商   | 仓储、运输、报关、保险、代理等供应商  |
| 内部业务订单 | 公司承接的供应链综合服务订单（核心锚点：代垫、成本、收入均源于此） |
| 收入订单  | 面向客户的收入合同，定义应收金额，销项发票的"可开票池" |
| 成本中心  | 部门/项目维度的费用归集单元，进项发票的成本归集目标 |
| 关务单   | 报关单、报检单、进口/出口业务单    |
| 仓储单   | 入库、出库、库存、仓储费用单      |
| 运输单   | 提货、配送、干线、国际运输等      |
| 费用单   | 由业务产生的费用明细          |
| 代垫单   | 公司为客户代垫的税费、关税、运杂费等，必须关联内部业务订单 |
| 结算单   | 对客户或供应商的费用汇总结算      |
| 开票申请  | 由结算单或业务单据生成的开票请求    |
| 销项发票  | 公司开给客户的发票，必须关联收入订单   |
| 进项发票  | 供应商开给公司的发票，必须关联成本对象  |
| 海关票据  | 海关进口增值税专用缴款书、关税缴款书等 |
| 红字申请  | 红冲蓝字发票的申请           |
| 红字确认单 | 模拟税务红字发票信息确认单       |
| 作废申请  | 对可作废票据或开票申请的作废流程    |
| 档案    | 发票、单据、附件、日志的归档集合    |

---

## 7. 发票类型与业务口径

### 7.1 支持票据类型

| 类型           | 系统名称                       | 用途           |
| ------------ | -------------------------- | ------------ |
| 数电专票         | DIGITAL_SPECIAL            | 销项/进项专票      |
| 数电普票         | DIGITAL_NORMAL             | 普通发票         |
| 增值税专用发票      | VAT_SPECIAL                | 传统专票模拟       |
| 增值税普通发票      | VAT_NORMAL                 | 传统普票模拟       |
| 电子普通发票       | E_NORMAL                   | 电子普票模拟       |
| 海关进口增值税专用缴款书 | CUSTOMS_IMPORT_VAT_PAYMENT | 进口增值税抵扣/归档   |
| 海关关税缴款书      | CUSTOMS_DUTY_PAYMENT       | 关税代垫/归档      |
| 运输服务发票       | TRANSPORT_INVOICE          | 运输供应商进项      |
| 仓储服务发票       | WAREHOUSE_INVOICE          | 仓储供应商进项      |
| 代垫费用收据/通知单   | ADVANCE_PAYMENT_NOTICE     | 非税务发票，仅作结算凭证 |
| 模拟红字发票       | RED_INVOICE                | 红冲结果         |

### 7.2 半导体供应链费用类型

| 费用类型   |       是否可开票 | 是否可代垫 | 示例          |
| ------ | ----------: | ----: | ----------- |
| 关务服务费  |           是 |     否 | 报关服务费、单证服务费 |
| 仓储服务费  |           是 |     否 | 入库费、库租、操作费  |
| 运输服务费  |           是 |   可配置 | 国内运输、国际运输   |
| 代理服务费  |           是 |     否 | 供应链代理费      |
| 关税     | 通常不作为服务收入开票 |     是 | 海关关税        |
| 进口增值税  | 通常不作为服务收入开票 |     是 | 海关进口增值税     |
| 查验费    |         可配置 |     是 | 海关查验相关费用    |
| 港杂费    |         可配置 |     是 | 港口杂费        |
| 保险费    |         可配置 |     是 | 货运保险        |
| 快递费    |         可配置 |     是 | 文件/样品快递     |
| 其他代垫费用 |         可配置 |     是 | 临时费用        |

> 注意：代垫费用实际是否开票、如何开票、是否作为价外费用处理，需要企业税务顾问或财务负责人确认。本系统原型提供多种“开票策略”，但不替代真实税务判断。

---

## 8. 代垫费用管理

### 8.1 业务定义

代垫费用是指公司在供应链服务过程中，先替客户支付或承担的费用，后续向客户收回。半导体供应链场景中常见代垫包括：

1. 进口关税。
2. 进口增值税。
3. 港杂费。
4. 查验费。
5. 仓储第三方费用。
6. 运输第三方费用。
7. 报关异常处理费用。
8. 检验检疫费用。
9. 快递/文件费。
10. 保险费。

### 8.2 代垫单状态

| 状态   | 编码                  | 说明         |
| ---- | ------------------- | ---------- |
| 草稿   | DRAFT               | 业务人员创建，未提交 |
| 待确认  | PENDING_CONFIRM     | 等待客户/财务确认  |
| 已确认  | CONFIRMED           | 金额和承担方确认   |
| 待收款  | PENDING_COLLECTION  | 等客户付款      |
| 部分收款 | PARTIALLY_COLLECTED | 已部分收回      |
| 已收款  | COLLECTED           | 全部收回       |
| 已核销  | WRITTEN_OFF         | 财务完成核销     |
| 已取消  | CANCELLED           | 代垫单取消      |
| 已转争议 | DISPUTED            | 客户不认可或金额争议 |

### 8.3 代垫开票策略

系统支持在客户维度、合同维度、费用类型维度配置代垫开票策略：

| 策略           | 编码                 | 说明             |
| ------------ | ------------------ | -------------- |
| 不开票，仅收回代垫    | NO_INVOICE         | 仅生成代垫通知单和收款记录  |
| 代垫费用单独开票     | SEPARATE_INVOICE   | 将代垫费用作为单独开票项   |
| 与服务费合并开票     | MERGE_WITH_SERVICE | 代垫与服务费合并到同一张发票 |
| 仅服务费开票，代垫不开票 | SERVICE_ONLY       | 服务费开票，代垫通过往来收回 |
| 差额开票         | NET_AMOUNT_INVOICE | 仅对差额/服务加价部分开票  |
| 手工指定         | MANUAL             | 每次结算由财务选择      |

### 8.4 代垫单字段

| 字段     | 类型       | 必填 | 说明             |
| ------ | -------- | -: | -------------- |
| 代垫单号   | string   |  是 | 系统生成           |
| 客户     | relation |  是 | 关联客户           |
| 业务订单   | relation |  是 | 关联业务订单         |
| 报关单号   | string   |  否 | 关务场景           |
| 费用类型   | enum     |  是 | 关税/进口增值税/港杂费等  |
| 费用发生日期 | date     |  是 | 实际发生日期         |
| 币种     | enum     |  是 | CNY/USD/HKD 等  |
| 原币金额   | decimal  |  是 | 原始币种金额         |
| 汇率     | decimal  |  否 | 外币时使用          |
| 本位币金额  | decimal  |  是 | 人民币金额          |
| 付款方    | enum     |  是 | 公司/客户/第三方      |
| 收款状态   | enum     |  是 | 待收/部分/已收       |
| 开票策略   | enum     |  是 | 见上表            |
| 是否进入结算 | boolean  |  是 | 是否纳入客户结算单      |
| 是否已开票  | boolean  |  是 | 是否与发票关联        |
| 附件     | file[]   |  否 | 缴款书、付款凭证、供应商账单 |
| 备注     | text     |  否 | 说明             |

### 8.5 代垫业务流程

```text
业务发生
  ↓
创建代垫单
  ↓
上传附件：海关缴款书/供应商账单/付款凭证
  ↓
财务确认费用性质
  ↓
客户确认金额
  ↓
进入客户结算单
  ↓
根据开票策略生成开票申请或代垫通知单
  ↓
客户付款
  ↓
收款核销
  ↓
归档
```

### 8.6 代垫风控规则

| 规则                      | 说明 |
| ----------------------- | -- |
| 代垫金额不能为负                |    |
| 代垫单必须关联业务订单             |    |
| 关税/进口增值税类代垫必须关联报关单或海关票据 |    |
| 已核销代垫不能修改金额             |    |
| 已进入开票申请的代垫不能随意删除        |    |
| 同一报关单下同一费用类型可配置是否允许重复   |    |
| 代垫开票策略与客户合同不一致时提示风险     |    |
| 代垫金额与附件金额不一致时提示异常       |    |
| 客户未确认的代垫不能进入正式结算        |    |
| 已收款未核销超过 N 天提示          |    |

### 8.7 代垫与内部订单的关联

代垫费用不是独立产生的——它一定源自公司内部的某个业务订单。这条关联是代垫管理的核心锚点：

**关联逻辑：**

```text
内部业务订单（关务单 / 仓储单 / 运输单 / 综合服务订单）
  ├── 产生代垫需求（关税、增值税、港杂、运费等）
  ├── 创建代垫单时必须关联来源订单
  ├── 一张内部订单可产生多笔代垫
  └── 订单维度可汇总：订单总代垫金额、已收回、未收回
```

**设计原则：**

1. 代垫单 `business_order_id` 为必填字段，不允许"无订单代垫"。
2. 内部订单上维护三个代垫汇总字段：
   - `total_advance_amount`：累计代垫金额
   - `collected_advance_amount`：已从客户收回金额
   - `uncollected_advance_amount`：待收代垫余额
3. 订单关闭前，必须校验该订单下所有代垫是否已核销完毕。
4. 不同订单类型的代垫费用归集到各自的业务线成本中（关务成本、仓储成本、运输成本）。

**订单维度代垫查询：**

| 查询维度 | 说明 |
| -------- | ---- |
| 按订单汇总 | 查看某一订单下所有代垫的汇总金额和明细 |
| 按客户汇总 | 查看某一客户所有订单的代垫汇总 |
| 按报关单汇总 | 关务场景下按报关单查看 |
| 按费用类型汇总 | 关税类/增值税类/港杂类分别统计 |

---

## 9. 销项发票管理

### 9.1 功能目标

销项发票模块用于管理公司向客户开具的服务费、仓储费、运输费、代理费、代垫相关费用发票。

### 9.2 开票来源

| 来源     | 说明         |
| ------ | ---------- |
| 手工开票   | 财务直接创建     |
| 结算单开票  | 客户结算单生成    |
| 业务订单开票 | 单个业务订单直接开票 |
| 代垫单开票  | 代垫费用单独开票   |
| 批量导入   | Excel 导入   |
| API 创建 | 预留外部系统创建   |

### 9.3 开票申请状态

| 状态   | 编码                    | 说明          |
| ---- | --------------------- | ----------- |
| 草稿   | DRAFT                 | 可编辑         |
| 待提交  | READY                 | 已校验，可提交     |
| 待审批  | PENDING_APPROVAL      | 等待财务主管审批    |
| 审批驳回 | REJECTED              | 需修改         |
| 待开票  | PENDING_ISSUE         | 审批通过        |
| 开票中  | ISSUING               | 已提交模拟税务通道   |
| 开票成功 | ISSUED                | 已生成模拟发票     |
| 开票失败 | ISSUE_FAILED          | 模拟通道返回失败    |
| 已交付  | DELIVERED             | 已模拟邮件/二维码交付 |
| 已红冲  | RED_FLUSHED           | 已全部红冲       |
| 部分红冲 | PARTIALLY_RED_FLUSHED | 部分金额红冲      |
| 已作废  | VOIDED                | 符合作废条件并已作废  |
| 已取消  | CANCELLED             | 未开票前取消      |

### 9.4 开票字段

| 字段       | 类型       |      必填 | 说明                |
| -------- | -------- | ------: | ----------------- |
| 开票申请号    | string   |       是 | 系统生成              |
| 来源类型     | enum     |       是 | 手工/结算单/订单/代垫单/API |
| 来源单号     | string   |       否 | 来源业务单据            |
| 销售方主体    | relation |       是 | 公司开票主体            |
| 销售方税号    | string   |       是 | 纳税人识别号            |
| 购买方客户    | relation |       是 | 客户                |
| 购买方名称    | string   |       是 | 发票抬头              |
| 购买方税号    | string   |   企业票必填 | 企业税号              |
| 购买方地址电话  | string   | 专票可配置必填 | 专票信息              |
| 购买方开户行账号 | string   | 专票可配置必填 | 专票信息              |
| 发票类型     | enum     |       是 | 数电专票/数电普票等        |
| 开票项目     | array    |       是 | 明细                |
| 不含税金额    | decimal  |       是 | 自动计算              |
| 税额       | decimal  |       是 | 自动计算              |
| 价税合计     | decimal  |       是 | 自动计算              |
| 币种       | enum     |       是 | 默认 CNY            |
| 汇率       | decimal  |       否 | 外币业务              |
| 备注       | text     |       否 | 可带报关单号/合同号        |
| 交付方式     | enum     |       是 | 邮件/二维码/下载         |
| 收件邮箱     | string   |       否 | 邮件交付              |
| 附件       | file[]   |       否 | 结算单、合同等           |
| 开票员      | user     |       是 | 当前用户              |
| 审批人      | user     |       否 | 审批流               |
| 模拟发票号码   | string   |   开票后生成 | 原型生成              |
| 模拟税务流水号  | string   |   开票后生成 | Mock              |

### 9.5 开票明细字段

| 字段     | 类型       | 必填 | 说明           |
| ------ | -------- | -: | ------------ |
| 项目名称   | string   |  是 | 例如关务服务费、仓储费  |
| 税收分类编码 | string   |  是 | 原型可手工维护      |
| 规格型号   | string   |  否 | 可空           |
| 单位     | string   |  否 | 次/票/月/公斤/立方  |
| 数量     | decimal  |  是 | 默认 1         |
| 单价     | decimal  |  是 | 不含税单价        |
| 金额     | decimal  |  是 | 不含税金额        |
| 税率     | decimal  |  是 | 例如 6%、9%、13% |
| 税额     | decimal  |  是 | 自动计算         |
| 价税合计   | decimal  |  是 | 自动计算         |
| 费用类型   | enum     |  是 | 服务费/仓储/运输/代垫 |
| 关联费用单  | relation |  否 | 来源费用         |
| 关联代垫单  | relation |  否 | 来源代垫         |

### 9.6 开票校验规则

| 规则                | 错误级别     |
| ----------------- | -------- |
| 购买方名称不能为空         | 阻断       |
| 企业抬头时税号不能为空       | 阻断       |
| 发票明细不能为空          | 阻断       |
| 税率不能为空            | 阻断       |
| 税额计算误差超过允许范围      | 阻断       |
| 同一来源单据已全部开票       | 阻断       |
| 开票金额超过可开票余额       | 阻断       |
| 代垫费用未确认不能开票       | 阻断       |
| 客户黑名单             | 阻断/预警可配置 |
| 抬头与客户档案不一致        | 预警       |
| 税收分类编码缺失          | 阻断       |
| 备注缺少报关单号但配置要求必须填写 | 阻断       |
| 开票金额超过审批额度        | 进入高级审批   |

### 9.7 销项与收入订单的关联

销项发票不是孤立开出的 —— 它是对客户收入订单的"发票化"。每一张销项发票必须能够追溯到对应的收入来源。

**关联逻辑：**

```text
客户收入订单（Revenue Order / 客户结算单）
  ├── 定义了客户应付的服务费、仓储费、运输费、代理费等
  ├── 是销项开票的"可开票池"
  ├── 开票申请从收入订单/结算单中选取费用明细
  ├── 一个收入订单可分批多次开票
  └── 收入订单金额 = 已开票金额 + 待开票金额
```

**设计原则：**

1. 收入订单上维护开票状态字段，汇总维度包括：
   - `total_revenue_amount`：收入订单总额（不含税）
   - `invoiced_amount`：已开票金额
   - `available_amount`：可开票余额
   - `invoice_status`：未开票 / 部分开票 / 已开票 / 已超额
2. 开票申请的 `source_type` 和 `source_id` 必须指向收入订单或结算单。
3. 开票金额校验时，系统必须校验开票总额不超过收入订单的可开票余额。
4. 收入订单关闭前，校验是否已全额开票（可配置为允许部分开票后关闭）。
5. 红冲后，若金额回退，收入订单的可开票余额应同步恢复。

**收入订单 → 销项发票的追溯链路：**

| 追溯方向 | 说明 |
| -------- | ---- |
| 收入订单 → 开票申请 → 销项发票 | 正向：从收入找对应的全部发票 |
| 销项发票 → 开票申请 → 收入订单 | 逆向：从发票反查收入来源 |
| 收入订单维度汇总 | 已开票金额、未开票金额、最后开票日期 |
| 客户维度汇总 | 跨订单汇总所有收入与开票 |

**收入订单与结算单的关系：**

```text
收入订单（合同级别）
  ├── 结算单 1（第1期结算）→ 开票申请 → 销项发票
  ├── 结算单 2（第2期结算）→ 开票申请 → 销项发票
  └── 结算单 N（尾款结算）→ 开票申请 → 销项发票
```

收入订单是"应该收多少"，结算单是"本期结算多少"，销项发票是"本期开了多少票"。三层金额互相校验。

---

## 10. 红冲管理

### 10.1 业务定义

红冲用于处理已开具蓝字发票后发生的销售退回、服务中止、开票错误、销售折让、金额调整等情况。数电票场景下，蓝字发票开具后如发生退回、开票有误、服务中止、销售折让等，应按规定开具红字数电发票。

### 10.2 红冲类型

| 类型   | 编码                  | 说明           |
| ---- | ------------------- | ------------ |
| 全额红冲 | FULL                | 红冲整张发票       |
| 部分红冲 | PARTIAL             | 仅红冲部分金额或部分明细 |
| 错票重开 | REISSUE             | 先红冲再重新开正确蓝票  |
| 折让红冲 | DISCOUNT            | 销售折让         |
| 服务中止 | SERVICE_TERMINATION | 服务未完成        |
| 退货红冲 | RETURN              | 货物/服务退回      |

### 10.3 红冲状态

| 状态       | 编码                          | 说明        |
| -------- | --------------------------- | --------- |
| 草稿       | DRAFT                       | 可编辑       |
| 待审批      | PENDING_APPROVAL            | 内部审批      |
| 审批驳回     | REJECTED                    | 驳回        |
| 待确认单     | PENDING_CONFIRM_FORM        | 需生成红字确认单  |
| 确认单待对方确认 | WAITING_COUNTERPART_CONFIRM | 模拟对方确认    |
| 确认单已确认   | CONFIRMED                   | 可开红票      |
| 确认单超时作废  | CONFIRM_FORM_EXPIRED        | 72 小时模拟超时 |
| 红票开具中    | RED_ISSUING                 | 提交模拟通道    |
| 红票开具成功   | RED_ISSUED                  | 生成红字发票    |
| 红票开具失败   | RED_FAILED                  | 通道失败      |
| 已完成      | COMPLETED                   | 完整结束      |
| 已取消      | CANCELLED                   | 取消        |

### 10.4 红冲规则

国家税务总局公告中明确：蓝字数电发票未进行用途确认及入账确认的，由开票方发起红冲流程并直接开具红字数电发票；蓝字数电发票已进行用途确认或入账确认的，开票方或受票方均可发起红冲流程，并经对方确认《红字发票信息确认单》后，由开票方开具红字数电发票；确认单发起后 72 小时内未经确认的自动作废。

系统按原型模拟以下规则：

| 场景              | 系统处理             |
| --------------- | ---------------- |
| 蓝票未入账、未抵扣、未确认用途 | 内部审批后直接开红字发票     |
| 蓝票已入账           | 生成红字确认单，模拟对方确认   |
| 蓝票已抵扣           | 生成红字确认单，并提示进项转出  |
| 蓝票已归档           | 允许红冲，但归档状态生成变更记录 |
| 蓝票已全部红冲         | 不允许再次红冲          |
| 部分红冲金额超过蓝票余额    | 阻断               |
| 红冲后需重开          | 自动生成重开草稿         |
| 确认单超过 72 小时未确认  | 自动变为确认单超时作废      |

### 10.5 红冲流程

```text
选择蓝字发票
  ↓
填写红冲原因
  ↓
选择全额/部分红冲
  ↓
系统校验可红冲金额、入账状态、用途状态
  ↓
内部审批
  ↓
判断是否需要红字确认单
  ↓
无需确认单：直接模拟开具红字发票
  ↓
需要确认单：生成确认单 → 等待对方确认/拒绝/超时
  ↓
确认通过后模拟开具红字发票
  ↓
更新蓝票红冲状态
  ↓
如需重开，生成新蓝票草稿
  ↓
归档
```

### 10.6 红冲申请字段

| 字段      | 类型       |    必填 | 说明          |
| ------- | -------- | ----: | ----------- |
| 红冲申请号   | string   |     是 | 系统生成        |
| 原蓝票 ID  | relation |     是 | 关联原发票       |
| 红冲类型    | enum     |     是 | 全额/部分/错票重开  |
| 红冲原因    | enum     |     是 | 退回/折让/开票错误等 |
| 原因说明    | text     |     是 | 详细说明        |
| 红冲明细    | array    |     是 | 对应蓝票明细      |
| 红冲不含税金额 | decimal  |     是 | 自动计算        |
| 红冲税额    | decimal  |     是 | 自动计算        |
| 红冲价税合计  | decimal  |     是 | 自动计算        |
| 是否需要重开  | boolean  |     是 | 是/否         |
| 审批人     | user     |     否 | 内部审批        |
| 确认单号    | string   |  条件必填 | 需要确认单时生成    |
| 模拟红票号码  | string   | 开具后生成 | 原型生成        |
| 附件      | file[]   |     否 | 客户邮件、退款证明等  |

---

## 11. 作废管理

### 11.1 业务定位

本系统将“作废”拆成三类：

| 类别       | 系统名称                | 说明             |
| -------- | ------------------- | -------------- |
| 开票申请取消   | APPLICATION_CANCEL  | 未开票前取消，不属于税务作废 |
| 模拟传统票据作废 | LEGACY_INVOICE_VOID | 用于传统纸票/历史票据模拟  |
| 代开发票作废模拟 | AGENCY_INVOICE_VOID | 代开发票当月作废模拟     |

代开发票作废的公开办税事项中提到，纳税人代开发票后，发生销售退回、开票有误、应税服务中止等情形，需作废已代开增值税发票的，可凭已代开发票在代开当月向原代开税务机关提出作废申请；不符合作废条件的，可以通过开具红字发票方式对原发票对冲处理。

### 11.2 作废适用范围

| 场景          |  是否允许作废 | 说明         |
| ----------- | ------: | ---------- |
| 开票申请草稿      |       是 | 直接取消       |
| 待审批开票申请     |       是 | 取消申请       |
| 审批通过但未开票    |       是 | 撤销         |
| 数电票已开具      | 原型默认不允许 | 走红冲        |
| 传统票据当月未交付   |   可模拟允许 | 配置控制       |
| 传统票据已入账/已抵扣 |     不允许 | 走红冲        |
| 已红冲发票       |     不允许 | 已处理        |
| 已归档发票       | 不允许直接作废 | 需先走红冲或档案变更 |

### 11.3 作废流程

```text
选择发票或开票申请
  ↓
系统判断是否可作废
  ↓
填写作废原因
  ↓
上传附件/说明
  ↓
内部审批
  ↓
模拟作废
  ↓
更新发票状态
  ↓
释放来源单据可开票余额
  ↓
记录操作日志
  ↓
归档作废记录
```

### 11.4 作废原因

| 原因     | 编码                 |
| ------ | ------------------ |
| 抬头错误   | BUYER_INFO_ERROR   |
| 税号错误   | TAX_NO_ERROR       |
| 金额错误   | AMOUNT_ERROR       |
| 税率错误   | TAX_RATE_ERROR     |
| 项目名称错误 | ITEM_ERROR         |
| 重复开票   | DUPLICATE_ISSUE    |
| 客户取消   | CUSTOMER_CANCELLED |
| 业务取消   | BUSINESS_CANCELLED |
| 其他     | OTHER              |

---

## 12. 进项发票管理

### 12.1 功能目标

进项发票模块用于管理供应商开给公司的发票，包括运输服务费、仓储服务费、报关服务费、代理服务费、保险费等。

### 12.2 收票来源

| 来源       | 说明             |
| -------- | -------------- |
| 手工录入     | 财务录入           |
| 文件上传     | PDF/OFD/XML/图片 |
| 邮箱收票     | 预留             |
| 供应商上传    | 预留供应商门户        |
| API 推送   | 预留             |
| 税务数字账户下载 | 预留             |
| 批量导入     | Excel 导入       |

### 12.3 进项发票状态

| 状态   | 编码             | 说明       |
| ---- | -------------- | -------- |
| 待识别  | PENDING_PARSE  | 文件待解析    |
| 已识别  | PARSED         | 已生成结构化数据 |
| 待查验  | PENDING_VERIFY | 待验真      |
| 查验通过 | VERIFIED       | 模拟查验通过   |
| 查验失败 | VERIFY_FAILED  | 模拟查验失败   |
| 待匹配  | PENDING_MATCH  | 待匹配业务单据  |
| 已匹配  | MATCHED        | 已关联业务/费用 |
| 待认证  | PENDING_DEDUCT | 待勾选认证    |
| 已认证  | DEDUCTED       | 已模拟认证    |
| 不抵扣  | NON_DEDUCT     | 不参与抵扣    |
| 已入账  | ACCOUNTED      | 已生成凭证/入账 |
| 已归档  | ARCHIVED       | 已归档      |
| 已红冲  | RED_FLUSHED    | 供应商红冲    |
| 异常   | ABNORMAL       | 风险异常     |

### 12.4 进项发票字段

| 字段    | 类型       |    必填 | 说明            |
| ----- | -------- | ----: | ------------- |
| 发票 ID | string   |     是 | 系统生成          |
| 发票类型  | enum     |     是 | 专票/普票/运输票等    |
| 发票号码  | string   |     是 | 数电票 20 位或传统票号 |
| 发票代码  | string   | 传统票必填 | 传统发票          |
| 开票日期  | date     |     是 | 发票日期          |
| 销售方名称 | string   |     是 | 供应商           |
| 销售方税号 | string   |     是 | 供应商税号         |
| 购买方名称 | string   |     是 | 我方主体          |
| 购买方税号 | string   |     是 | 我方税号          |
| 不含税金额 | decimal  |     是 | 金额            |
| 税额    | decimal  |     是 | 税额            |
| 价税合计  | decimal  |     是 | 合计            |
| 税率    | decimal  |     是 | 主税率           |
| 查验状态  | enum     |     是 | 待查验/通过/失败     |
| 认证状态  | enum     |     是 | 待认证/已认证/不抵扣   |
| 入账状态  | enum     |     是 | 未入账/已入账       |
| 归档状态  | enum     |     是 | 未归档/已归档       |
| 文件    | file[]   |     否 | 原件            |
| 关联供应商 | relation |     否 | 供应商档案         |
| 关联业务单 | relation |     否 | 运输/仓储/关务单     |
| 关联付款单 | relation |     否 | 应付付款          |

### 12.5 查验能力

单位和个人可以通过全国增值税发票查验平台查验数电票信息，也可以通过电子发票服务平台或税务数字账户进行相关查询；广东税务资料显示，全国增值税发票查验平台一般支持单张发票查验，而税务数字账户发票查验模块可支持单张和批量查验。

原型中提供 Mock 查验：

| 查验结果  | 说明             |
| ----- | -------------- |
| 查验通过  | 发票存在且信息一致      |
| 查无此票  | 模拟不存在          |
| 金额不一致 | 模拟票面金额与查验结果不一致 |
| 销方异常  | 模拟供应商风险        |
| 已作废   | 模拟发票已作废        |
| 已红冲   | 模拟发票已红冲        |
| 查验超时  | 模拟外部平台超时       |

### 12.6 进项与成本的关联

进项发票是供应商开给公司的，本质上是公司的**外部成本凭证**。每一张进项发票必须归集到对应的成本对象和业务订单上，才能支撑后续的成本核算与利润分析。

**关联逻辑：**

```text
内部业务订单 / 成本中心
  ├── 运输订单 → 运输供应商发票 → 运输成本
  ├── 仓储订单 → 仓储供应商发票 → 仓储成本
  ├── 关务代理订单 → 关务供应商发票 → 关务代理成本
  ├── 保险服务订单 → 保险供应商发票 → 保险费成本
  └── 其他服务订单 → 其他供应商发票 → 其他营业成本
```

**设计原则：**

1. 进项发票必须关联成本归集对象，不允许"无主进项票"。
2. 成本归集对象包括：
   - **内部业务订单**：运输单、仓储单、关务单等（直接成本）
   - **成本中心**：部门/项目维度（间接费用）
   - **代垫中转**：若进项票对应的费用将由客户承担（先垫后收），标记为代垫成本
3. 进项发票上的关键成本字段：
   - `cost_center_id`：成本中心
   - `business_order_id`：关联的内部业务订单
   - `cost_type`：运输成本 / 仓储成本 / 关务成本 / 代理成本 / 保险费 / 其他
   - `is_advance_cost`：是否为代垫成本（将向客户收回）
   - `cost_allocation_ratio`：成本分摊比例（一张进项票分摊到多个订单时）
4. 进项发票的税额关联认证抵扣状态，作为增值税进项税额管理。

**成本归集规则：**

| 进项发票来源 | 归集目标 | 成本类型 |
| ------------ | -------- | -------- |
| 运输供应商 | 对应运输订单 | 运输成本 |
| 仓储供应商 | 对应仓储订单 | 仓储成本 |
| 报关代理商 | 对应关务订单 | 关务代理成本 |
| 保险公司 | 对应保险服务订单 | 保险费 |
| 代垫类进项 | 对应客户/订单（标记代垫） | 代垫成本（待收回） |
| 行政/管理类 | 成本中心 | 管理费用 |

**进项 → 成本的追溯链路：**

| 追溯方向 | 说明 |
| -------- | ---- |
| 进项发票 → 业务订单 → 成本中心 | 正向：从进项票找成本归属 |
| 业务订单 → 进项发票列表 | 逆向：从订单查所有供应商发票 |
| 成本中心维度汇总 | 按成本中心汇总进项金额、税额、认证状态 |
| 代垫成本汇总 | 统计已代垫未收回的进项成本 |

**与销项的对账关系：**

```text
收入订单的利润率 = （销项收入 - 关联的进项成本 - 代垫收回） / 销项收入

这使得系统可以从发票层面支撑：
  ├── 客户维度利润率分析
  ├── 业务订单维度盈亏分析
  └── 代垫收回率监控
```

---

## 13. 海关票据管理

### 13.1 功能目标

支持半导体进口业务中的海关税费票据管理，尤其是：

1. 海关进口增值税专用缴款书。
2. 关税缴款书。
3. 报关单。
4. 税单。
5. 缴款凭证。
6. 进口增值税抵扣状态。
7. 代垫客户费用关联。

北京税务的公开答复中提到，海关进口增值税专用缴款书可通过电子税务局的税务数字账户进入发票勾选确认、抵扣类勾选、海关缴款书路径进行勾选确认。

### 13.2 海关票据字段

| 字段      | 类型       | 必填 | 说明           |
| ------- | -------- | -: | ------------ |
| 海关票据 ID | string   |  是 | 系统生成         |
| 票据类型    | enum     |  是 | 进口增值税/关税     |
| 税单号     | string   |  是 | 海关税单号        |
| 报关单号    | string   |  是 | 关联报关单        |
| 进口口岸    | string   |  否 | 口岸           |
| 申报单位    | string   |  否 | 报关公司         |
| 消费使用单位  | string   |  否 | 委托客户         |
| 纳税单位    | string   |  是 | 缴款主体         |
| 税种      | enum     |  是 | 关税/进口增值税     |
| 税额      | decimal  |  是 | 税款           |
| 缴款日期    | date     |  是 | 支付日期         |
| 币种      | enum     |  是 | 默认 CNY       |
| 是否代垫    | boolean  |  是 | 是否客户承担       |
| 代垫单     | relation |  否 | 关联代垫         |
| 抵扣状态    | enum     |  否 | 未勾选/已勾选/不可抵扣 |
| 入账状态    | enum     |  是 | 未入账/已入账      |
| 附件      | file[]   |  否 | 缴款书、报关单      |

### 13.3 海关票据流程

```text
进口业务产生
  ↓
录入/导入报关单
  ↓
录入海关缴款书
  ↓
判断是否公司代垫
  ↓
如代垫，生成代垫单
  ↓
如进口增值税可抵扣，进入抵扣状态管理
  ↓
关联客户结算
  ↓
收款核销
  ↓
入账
  ↓
归档
```

---

## 14. 结算单管理

### 14.1 功能目标

结算单用于汇总客户某一期间、某一业务订单、某一项目下的所有费用，作为开票和收款依据。

### 14.2 结算单类型

| 类型       | 说明         |
| -------- | ---------- |
| 客户应收结算单  | 向客户收取费用    |
| 供应商应付结算单 | 向供应商付款     |
| 代垫费用结算单  | 专门汇总代垫费用   |
| 综合结算单    | 服务费 + 代垫费用 |

### 14.3 结算单状态

| 状态    | 编码                       | 说明     |
| ----- | ------------------------ | ------ |
| 草稿    | DRAFT                    | 可编辑    |
| 待业务确认 | PENDING_BIZ_CONFIRM      | 业务确认   |
| 待财务确认 | PENDING_FIN_CONFIRM      | 财务确认   |
| 待客户确认 | PENDING_CUSTOMER_CONFIRM | 客户确认   |
| 已确认   | CONFIRMED                | 可开票/收款 |
| 部分开票  | PARTIALLY_INVOICED       | 部分开票   |
| 已开票   | INVOICED                 | 全部开票   |
| 部分收款  | PARTIALLY_RECEIVED       | 部分收款   |
| 已收款   | RECEIVED                 | 全部收款   |
| 已关闭   | CLOSED                   | 完成     |
| 已取消   | CANCELLED                | 取消     |

### 14.4 结算单生成规则

1. 可按客户 + 业务订单生成。
2. 可按客户 + 日期区间生成。
3. 可按报关单生成。
4. 可按项目生成。
5. 可选择是否包含代垫费用。
6. 可配置代垫费用是否进入开票金额。
7. 已进入结算单的费用不能重复生成其他结算单，除非取消或拆分。

---

## 15. 发票交付管理

### 15.1 交付方式

国家税务总局公告中明确，已开具的数电发票通过电子发票服务平台自动交付，开票方也可以通过电子邮件、二维码、下载打印等方式交付数电发票；下载打印方式交付的，票面会自动标记下载次数和打印次数。

原型支持：

| 方式         | 说明           |
| ---------- | ------------ |
| 邮件交付 Mock  | 模拟发送邮件       |
| 二维码交付 Mock | 生成模拟二维码      |
| 下载交付       | 下载模拟 PDF/OFD |
| API 回传     | 预留接口         |
| 客户门户查看     | 预留客户门户       |

### 15.2 交付状态

| 状态    | 编码          |
| ----- | ----------- |
| 待交付   | PENDING     |
| 交付中   | DELIVERING  |
| 已交付   | DELIVERED   |
| 交付失败  | FAILED      |
| 已下载   | DOWNLOADED  |
| 已打印   | PRINTED     |
| 已重新交付 | REDELIVERED |

---

## 16. 电子档案管理

### 16.1 档案对象

| 档案类型 | 说明             |
| ---- | -------------- |
| 发票原件 | PDF/OFD/XML/图片 |
| 开票申请 | 申请单、审批记录       |
| 红冲资料 | 红冲申请、确认单、红字发票  |
| 作废资料 | 作废申请、审批记录      |
| 代垫资料 | 代垫单、付款凭证、客户确认  |
| 关务资料 | 报关单、缴款书、税单     |
| 结算资料 | 结算单、客户确认单      |
| 入账资料 | 凭证号、入账日期       |
| 操作日志 | 全链路日志          |

### 16.2 归档规则

1. 开票成功后自动生成待归档记录。
2. 红冲完成后，蓝票和红票成组归档。
3. 作废完成后，作废记录与原票据归档。
4. 代垫核销后，代垫单、收款单、附件归档。
5. 海关票据入账后归档。
6. 已归档资料原则上不可删除，只能追加更正记录。

---

## 17. 风控规则中心

### 17.1 风控类型

| 类型    | 规则示例          |
| ----- | ------------- |
| 发票真实性 | 查验失败、查无此票     |
| 重复风险  | 同一发票号码重复录入    |
| 抬头风险  | 购买方税号与公司税号不一致 |
| 金额风险  | 发票金额超过结算单可开金额 |
| 税率风险  | 项目税率与配置不一致    |
| 税编风险  | 项目未维护税收分类编码   |
| 代垫风险  | 代垫未确认即开票      |
| 红冲风险  | 红冲金额超过可红冲余额   |
| 作废风险  | 已入账发票申请作废     |
| 客户风险  | 客户黑名单         |
| 供应商风险 | 供应商黑名单        |
| 关务风险  | 海关票据未关联报关单    |
| 入账风险  | 已认证但未入账超过 N 天 |
| 归档风险  | 已开票未归档超过 N 天  |

### 17.2 风险等级

| 等级 | 说明     |
| -- | ------ |
| 低  | 提示即可   |
| 中  | 需要用户确认 |
| 高  | 需要主管审批 |
| 严重 | 阻断流程   |

---

## 18. 报表与看板

### 18.1 首页工作台

| 卡片   | 指标           |
| ---- | ------------ |
| 待开票  | 待审批、待开票、开票失败 |
| 待收票  | 待识别、待查验      |
| 待红冲  | 待确认、待开红票     |
| 待作废  | 待审批          |
| 代垫待收 | 待收款、部分收款     |
| 海关票据 | 待抵扣、待入账      |
| 风险预警 | 高风险、严重风险     |
| 归档待办 | 待归档发票数量      |

### 18.2 报表列表

| 报表      | 说明             |
| ------- | -------------- |
| 销项发票台账  | 按客户、主体、期间、业务类型 |
| 进项发票台账  | 按供应商、期间、认证状态   |
| 代垫费用明细表 | 按客户、报关单、费用类型   |
| 代垫收款跟踪表 | 应收、已收、未收       |
| 红冲明细表   | 原蓝票、红票、原因      |
| 作废明细表   | 作废原因、审批人       |
| 海关票据台账  | 报关单、税单、抵扣状态    |
| 结算开票差异表 | 结算金额、已开票、未开票   |
| 发票风险报表  | 风险类型、等级、处理状态   |
| 归档完整性报表 | 是否缺附件、缺凭证      |

---

## 19. 页面结构设计

基于 Next.js App Router，建议页面结构如下：

```text
/app
  /(auth)
    /login
  /(dashboard)
    /dashboard
  /(master-data)
    /customers
    /suppliers
    /organizations
    /tax-subjects
    /invoice-items
    /tax-codes
  /(business)
    /orders
    /customs-declarations
    /warehouse-orders
    /transport-orders
    /fee-items
  /(advance-payments)
    /advance-payments
    /advance-payments/[id]
    /advance-settlements
  /(settlement)
    /customer-settlements
    /supplier-settlements
  /(output-invoices)
    /applications
    /applications/[id]
    /invoices
    /invoices/[id]
    /delivery
  /(input-invoices)
    /collection
    /invoices
    /invoices/[id]
    /verification
    /deduction
  /(customs-bills)
    /customs-payment-books
    /customs-payment-books/[id]
  /(red-flush)
    /applications
    /applications/[id]
    /confirmation-forms
    /red-invoices
  /(void)
    /applications
  /(archive)
    /records
    /records/[id]
  /(risk)
    /rules
    /results
  /(reports)
    /output-ledger
    /input-ledger
    /advance-ledger
    /customs-ledger
    /risk-report
  /(settings)
    /users
    /roles
    /workflows
    /integrations
    /mock-center
```

---

## 20. Next.js 技术架构建议

### 20.1 技术栈

| 层       | 建议                           |
| ------- | ---------------------------- |
| 前端框架    | Next.js App Router           |
| UI      | shadcn/ui + Tailwind CSS     |
| 表格      | TanStack Table               |
| 表单      | React Hook Form + Zod        |
| 状态      | Zustand / TanStack Query     |
| 后端 API  | Next.js Route Handlers       |
| ORM     | Prisma                       |
| 数据库     | PostgreSQL                   |
| 文件存储    | 本地存储 / MinIO Mock            |
| 队列      | 原型可用数据库任务表，后期替换 Redis/BullMQ |
| 鉴权      | NextAuth/Auth.js             |
| 权限      | RBAC + 数据权限                  |
| PDF 生成  | React PDF / Puppeteer        |
| Mock 服务 | MSW 或内部 Mock Adapter         |
| 日志      | pino / 自定义操作日志表              |

### 20.2 架构分层

```text
UI Layer
  ↓
Application Layer
  ↓
Domain Service Layer
  ↓
Repository Layer
  ↓
Integration Adapter Layer
  ↓
Mock External Services
```

### 20.3 推荐目录

```text
/src
  /app
  /components
  /features
    /output-invoice
    /input-invoice
    /advance-payment
    /red-flush
    /void
    /customs
    /settlement
    /archive
    /risk
  /server
    /services
    /repositories
    /adapters
    /workflows
    /validators
  /lib
    /auth
    /db
    /permissions
    /money
    /tax
    /files
  /types
  /constants
  /schemas
```

### 20.4 核心适配器接口

```ts
export interface InvoiceChannelAdapter {
  preCheck(input: InvoiceIssueInput): Promise<InvoicePreCheckResult>;
  issue(input: InvoiceIssueInput): Promise<InvoiceIssueResult>;
  query(requestId: string): Promise<InvoiceQueryResult>;
  redIssue(input: RedInvoiceIssueInput): Promise<RedInvoiceIssueResult>;
  voidInvoice(input: VoidInvoiceInput): Promise<VoidInvoiceResult>;
  getFiles(invoiceId: string): Promise<InvoiceFileResult>;
}
```

```ts
export interface TaxVerificationAdapter {
  verifyInvoice(input: VerifyInvoiceInput): Promise<VerifyInvoiceResult>;
  batchVerify(inputs: VerifyInvoiceInput[]): Promise<VerifyInvoiceResult[]>;
}
```

```ts
export interface CustomsAdapter {
  syncDeclaration(input: CustomsDeclarationQuery): Promise<CustomsDeclarationResult>;
  syncPaymentBook(input: CustomsPaymentBookQuery): Promise<CustomsPaymentBookResult>;
}
```

```ts
export interface DeliveryAdapter {
  sendEmail(input: InvoiceEmailInput): Promise<DeliveryResult>;
  generateQrCode(input: InvoiceQrInput): Promise<DeliveryResult>;
}
```

---

## 21. API 设计

### 21.1 销项发票 API

| 方法   | 地址                                             | 说明     |
| ---- | ---------------------------------------------- | ------ |
| GET  | `/api/output-invoice/applications`             | 查询开票申请 |
| POST | `/api/output-invoice/applications`             | 创建开票申请 |
| GET  | `/api/output-invoice/applications/:id`         | 查看详情   |
| PUT  | `/api/output-invoice/applications/:id`         | 编辑     |
| POST | `/api/output-invoice/applications/:id/submit`  | 提交审批   |
| POST | `/api/output-invoice/applications/:id/approve` | 审批     |
| POST | `/api/output-invoice/applications/:id/reject`  | 驳回     |
| POST | `/api/output-invoice/applications/:id/issue`   | 模拟开票   |
| POST | `/api/output-invoice/applications/:id/cancel`  | 取消申请   |
| GET  | `/api/output-invoice/invoices`                 | 查询销项发票 |
| GET  | `/api/output-invoice/invoices/:id`             | 发票详情   |
| POST | `/api/output-invoice/invoices/:id/deliver`     | 模拟交付   |
| GET  | `/api/output-invoice/invoices/:id/files`       | 获取文件   |

### 21.2 红冲 API

| 方法   | 地址                                                      | 说明         |
| ---- | ------------------------------------------------------- | ---------- |
| POST | `/api/red-flush/applications`                           | 创建红冲申请     |
| GET  | `/api/red-flush/applications`                           | 查询红冲申请     |
| GET  | `/api/red-flush/applications/:id`                       | 详情         |
| POST | `/api/red-flush/applications/:id/submit`                | 提交         |
| POST | `/api/red-flush/applications/:id/approve`               | 审批         |
| POST | `/api/red-flush/applications/:id/generate-confirm-form` | 生成确认单      |
| POST | `/api/red-flush/confirmation-forms/:id/confirm`         | 模拟对方确认     |
| POST | `/api/red-flush/confirmation-forms/:id/reject`          | 模拟对方拒绝     |
| POST | `/api/red-flush/confirmation-forms/:id/expire`          | 模拟 72 小时超时 |
| POST | `/api/red-flush/applications/:id/issue-red`             | 开具红字发票     |
| POST | `/api/red-flush/applications/:id/create-reissue-draft`  | 生成重开草稿     |

### 21.3 作废 API

| 方法   | 地址                                   | 说明     |
| ---- | ------------------------------------ | ------ |
| POST | `/api/void/applications`             | 创建作废申请 |
| GET  | `/api/void/applications`             | 查询     |
| POST | `/api/void/applications/:id/approve` | 审批     |
| POST | `/api/void/applications/:id/execute` | 执行作废   |
| POST | `/api/void/applications/:id/reject`  | 驳回     |

### 21.4 代垫 API

| 方法   | 地址                                                     | 说明      |
| ---- | ------------------------------------------------------ | ------- |
| GET  | `/api/advance-payments`                                | 查询代垫单   |
| POST | `/api/advance-payments`                                | 新增代垫单   |
| GET  | `/api/advance-payments/:id`                            | 详情      |
| PUT  | `/api/advance-payments/:id`                            | 编辑      |
| POST | `/api/advance-payments/:id/submit`                     | 提交确认    |
| POST | `/api/advance-payments/:id/confirm`                    | 财务/客户确认 |
| POST | `/api/advance-payments/:id/collect`                    | 登记收款    |
| POST | `/api/advance-payments/:id/write-off`                  | 核销      |
| POST | `/api/advance-payments/:id/create-invoice-application` | 生成开票申请  |

### 21.5 进项发票 API

| 方法   | 地址                                | 说明       |
| ---- | --------------------------------- | -------- |
| POST | `/api/input-invoices/upload`      | 上传文件     |
| POST | `/api/input-invoices`             | 手工新增     |
| GET  | `/api/input-invoices`             | 查询       |
| GET  | `/api/input-invoices/:id`         | 详情       |
| POST | `/api/input-invoices/:id/parse`   | Mock OCR |
| POST | `/api/input-invoices/:id/verify`  | Mock 查验  |
| POST | `/api/input-invoices/:id/match`   | 匹配业务单据   |
| POST | `/api/input-invoices/:id/deduct`  | 模拟认证     |
| POST | `/api/input-invoices/:id/account` | 入账       |
| POST | `/api/input-invoices/:id/archive` | 归档       |

### 21.6 海关票据 API

| 方法   | 地址                                                      | 说明     |
| ---- | ------------------------------------------------------- | ------ |
| GET  | `/api/customs/payment-books`                            | 查询缴款书  |
| POST | `/api/customs/payment-books`                            | 新增     |
| GET  | `/api/customs/payment-books/:id`                        | 详情     |
| POST | `/api/customs/payment-books/:id/create-advance-payment` | 生成代垫   |
| POST | `/api/customs/payment-books/:id/deduct`                 | 模拟抵扣勾选 |
| POST | `/api/customs/payment-books/:id/account`                | 入账     |
| POST | `/api/customs/payment-books/:id/archive`                | 归档     |

---

## 22. 数据模型草案

### 22.1 核心表

```text
organizations
tax_subjects
customers
suppliers
business_orders
customs_declarations
warehouse_orders
transport_orders
fee_items
advance_payments
settlements
settlement_items
output_invoice_applications
output_invoice_application_items
output_invoices
output_invoice_items
input_invoices
input_invoice_items
customs_payment_books
red_flush_applications
red_flush_items
red_confirmation_forms
void_applications
invoice_files
invoice_delivery_records
invoice_verify_records
invoice_risk_results
archive_records
operation_logs
workflow_instances
workflow_tasks
integration_configs
mock_events
```

### 22.2 发票主表关键字段

```text
id
invoice_no
invoice_code
invoice_type
invoice_direction: OUTPUT / INPUT / CUSTOMS
blue_red_flag: BLUE / RED
original_invoice_id
seller_name
seller_tax_no
buyer_name
buyer_tax_no
issue_date
amount_without_tax
tax_amount
amount_with_tax
currency
status
issue_status
delivery_status
verify_status
deduct_status
account_status
archive_status
red_status
void_status
source_type
source_id
created_by
created_at
updated_at
```

### 22.3 代垫表关键字段

```text
id
advance_no
customer_id
business_order_id
customs_declaration_id
fee_type
occurred_date
currency
original_amount
exchange_rate
base_currency_amount
payer_type
invoice_strategy
settlement_status
collection_status
write_off_status
related_invoice_id
related_customs_payment_book_id
attachments
remark
created_by
created_at
updated_at
```

---

## 23. 语义层设计

### 23.1 定位与目标

语义层是架在原始数据库表与上层消费者之间的**业务语言翻译层**。它的核心使命是：

> 让数据"说人话"。AI Agent、报表引擎、自然语言查询都通过语义层理解数据，而不是直接面对表和字段名。

```text
原始数据层 (Prisma/PostgreSQL)
       ↓
  语义层 (Semantic Layer)
  ├── 实体字典：业务对象定义
  ├── 字段字典：字段的业务含义 & 同义词
  ├── 关系图谱：实体间的关联路径
  ├── 指标定义：KPI 计算逻辑
  └── 维度定义：可分组/切片/过滤的维度
       ↓
  消费者
  ├── REST API          （标准接口）
  ├── AI Agent          （自然语言 → 结构化查询）
  ├── Report Engine     （自动生成报表）
  └── Excel / BI 工具    （导出与分析）
```

### 23.2 语义层的核心概念

#### 实体 (Entity)

每个业务对象在语义层中是一个实体。实体有名称、描述、别名：

```ts
// 示例：语义层实体定义
interface SemanticEntity {
  name: string;           // 业务名称，如 "销项发票"
  tableName: string;      // 对应数据表，如 "output_invoices"
  aliases: string[];      // 同义词，如 ["开出的票", "销项", "蓝票", "对外发票"]
  description: string;    // 业务说明
  category: EntityCategory; // 分类：发票类 / 业务类 / 财务类 / 基础资料
}
```

**核心实体目录：**

| 实体 | 表 | 别名 | 类别 |
|------|-----|------|------|
| 销项发票 | `output_invoices` | 开出的票、销项、对外发票、客户发票 | 发票类 |
| 进项发票 | `input_invoices` | 收到的票、进项、供应商发票、成本票 | 发票类 |
| 开票申请 | `output_invoice_applications` | 开票请求、开票单 | 发票类 |
| 红冲申请 | `red_flush_applications` | 红字申请、冲红、负数发票 | 发票类 |
| 代垫单 | `advance_payments` | 垫付款、代垫费用、先垫后收 | 财务类 |
| 结算单 | `settlements` | 对账单、应收结算、应付结算 | 财务类 |
| 海关缴款书 | `customs_payment_books` | 海关票据、进口增值税票、关税单 | 关务类 |
| 客户 | `customers` | 委托人、甲方、付款方 | 基础资料 |
| 供应商 | `suppliers` | 服务商、乙方、收款方 | 基础资料 |
| 内部业务订单 | `business_orders` | 订单、服务单、委托单 | 业务类 |
| 收入订单 | `revenue_orders` | 收入合同、应收合同 | 财务类 |
| 成本中心 | `cost_centers` | 部门、项目、成本归集 | 财务类 |

#### 字段 (Attribute)

每个字段在语义层中有业务名称、类型、格式化规则、可查询属性：

```ts
interface SemanticAttribute {
  name: string;              // 字段名（表级）
  label: string;             // 业务标签，如 "不含税金额"
  aliases: string[];         // 同义词，如 ["金额", "净额", "未税金额"]
  type: 'string' | 'number' | 'date' | 'enum' | 'money' | 'boolean';
  format?: string;           // money→¥#,###.00, date→YYYY-MM-DD
  aggregatable: boolean;     // 是否可求和/平均
  filterable: boolean;       // 是否可作为筛选条件
  sortable: boolean;         // 是否可排序
  dimensionRef?: string;     // 关联的维度
}
```

**关键金额字段语义示例（解决"金额"歧义）：**

| 表字段 | 语义标签 | 别名 | 格式化 |
|--------|----------|------|--------|
| `amount_without_tax` | 不含税金额 | 净额、未税金额 | `¥1,234.56` |
| `tax_amount` | 税额 | 税金、税款 | `¥123.45` |
| `amount_with_tax` | 价税合计 | 总金额、含税金额、开票总额 | `¥1,358.01` |
| `original_amount` | 原币金额 | 外币金额 | `$200.00` |
| `base_currency_amount` | 本位币金额 | 人民币金额、折算金额 | `¥1,400.00` |

#### 关系 (Relationship)

语义层定义实体间的业务关系路径，AI 可以沿路径跨表查询：

```ts
interface SemanticRelationship {
  from: string;           // 来源实体
  to: string;             // 目标实体
  type: 'one_to_one' | 'one_to_many' | 'many_to_many';
  path: string[];         // 经过的表/字段路径
  description: string;    // 关系描述，如 "销项发票由开票申请生成"
}
```

**三锚点关系图谱：**

```text
内部业务订单 ──1:N──→ 代垫单        （订单产生代垫）
内部业务订单 ──1:N──→ 收入订单       （订单定义收入）
内部业务订单 ──1:N──→ 进项发票       （订单归集成本）

收入订单 ──1:N──→ 结算单            （合同分期结算）
结算单   ──1:N──→ 开票申请          （结算驱动开票）
开票申请 ──1:1──→ 销项发票          （申请生成发票）

进项发票 ──N:1──→ 成本中心          （成本归集）
进项发票 ──N:1──→ 供应商            （发票来源）
进项发票 ──N:1──→ 内部业务订单       （成本关联订单）

销项发票 ──N:1──→ 客户             （发票去向）
销项发票 ──1:1──→ 红冲申请          （蓝票→红冲）
销项发票 ──1:1──→ 作废申请          （发票→作废）

代垫单   ──N:1──→ 海关缴款书        （代垫来源）
代垫单   ──N:1──→ 结算单            （代垫进入结算）
```

#### 指标 (Metric)

指标是语义层定义的可计算业务指标：

```ts
interface SemanticMetric {
  name: string;              // 指标名
  label: string;             // 业务标签
  formula: string;           // 公式（自然语言 + 字段引用）
  dependsOn: string[];       // 依赖的实体和字段
  unit?: string;             // 单位（元、%、张）
  category: 'revenue' | 'cost' | 'advance' | 'tax' | 'risk' | 'efficiency';
}
```

**核心业务指标：**

| 指标 | 公式 | 单位 | 类别 |
|------|------|------|------|
| 本月开票总额 | SUM(销项发票.价税合计) WHERE 开票日期 IN 本月 | 元 | 收入 |
| 可开票余额 | SUM(收入订单.可开票余额) WHERE 客户=X | 元 | 收入 |
| 代垫收回率 | SUM(代垫单.已收金额) / SUM(代垫单.代垫总额) | % | 代垫 |
| 进项认证率 | COUNT(进项发票 WHERE 认证=已认证) / COUNT(全部进项发票) | % | 税务 |
| 待红冲金额 | SUM(红冲申请.红冲价税合计 WHERE 状态 IN 进行中) | 元 | 风险 |
| 订单利润率 | (SUM(销项收入) - SUM(进项成本)) / SUM(销项收入) | % | 利润 |
| 待归档数量 | COUNT(发票 WHERE 已开票 AND 未归档) | 张 | 效率 |
| 高风险事项 | COUNT(风控结果 WHERE 等级≥高 AND 未处理) | 条 | 风险 |
| 发票交付率 | COUNT(销项发票 WHERE 交付=已交付) / COUNT(全部已开票) | % | 效率 |

#### 维度 (Dimension)

维度定义数据可以怎么分组和切片：

```ts
interface SemanticDimension {
  name: string;
  label: string;
  sourceField: string;
  type: 'time' | 'categorical' | 'hierarchical';
  levels?: string[];      // 层级维度的各级别
}
```

| 维度 | 来源 | 层级 |
|------|------|------|
| 时间 | 开票日期 | 年 → 季 → 月 → 周 → 日 |
| 客户 | 客户名称 | 客户 → 集团 |
| 主体 | 开票主体 | — |
| 发票类型 | 发票类型 | 大类(数电/传统) → 小类(专票/普票) |
| 费用类型 | 费用类型 | 服务费/仓储费/运输费/代垫 |
| 开票员 | 创建人 | — |
| 税号 | 销售方税号 | — |
| 贸易方式 | 贸易方式(保税/非保税) | — |

### 23.3 AI 查询接口设计

语义层之上暴露一个 AI 查询接口，接收自然语言，返回结构化查询结果：

```ts
// AI 查询请求
interface SemanticQueryRequest {
  question: string;       // 自然语言问题
  context?: {             // 上下文（可选，缩小范围）
    entity?: string;      // 限定实体
    customerId?: string;  // 限定客户
    dateRange?: { from: Date; to: Date };
  };
}

// AI 查询响应
interface SemanticQueryResponse {
  originalQuestion: string;         // 原始问题
  interpretation: {                 // AI 的理解
    intent: string;                 // 意图分类
    entities: string[];             // 涉及的实体
    metrics: string[];              // 涉及的指标
    filters: Record<string, any>;   // 推断的过滤条件
    groupBy?: string[];             // 推断的分组维度
    confidence: number;             // 理解置信度 0-1
  };
  result: {
    type: 'value' | 'table' | 'chart';
    data: any;
    summary: string;                // 自然语言摘要
  };
  sql: string;                      // 生成的 SQL（可审计）
}
```

**示例对话：**

```text
用户： "上个月深圳分公司的代垫收回率是多少？"
  ↓ AI 解析
意图: 查询指标
实体: [代垫单, 客户]
指标: [代垫收回率]
过滤: {时间: "上个月", 客户分公司: "深圳"}
  ↓ 语义层翻译
SELECT SUM(collected_amount) / SUM(total_advance_amount)
FROM advance_payments
JOIN customers ON ...
WHERE customers.branch = '深圳'
  AND occurred_date BETWEEN '2026-06-01' AND '2026-06-30'
  ↓ 返回
{
  interpretation: { intent: "查询指标", confidence: 0.94 },
  result: { type: "value", data: 0.87, summary: "上个月深圳分公司代垫收回率为 87%" }
}
```

### 23.4 语义层存储结构

语义层元数据以 JSON 配置文件存储在项目中，便于 AI Agent 和报表引擎调用：

```text
/src
  /semantic
    entities.json        # 实体定义
    attributes.json      # 字段定义
    relationships.json   # 关系图谱
    metrics.json         # 指标定义
    dimensions.json      # 维度定义
    synonyms.json        # 同义词映射
    index.ts             # 语义层加载器 & 查询 API
```

### 23.5 语义层与三锚点的关系

语义层的最大价值在于**让三锚点关系可被 AI 理解**：

| 锚点 | 语义层表现 |
|------|-----------|
| 代垫 ↔ 内部订单 | AI 知道"查代垫"时可以沿关系路径穿透到订单，反之亦可 |
| 销项 ↔ 收入订单 | AI 知道"收入"和"开票"是两个不同但关联的概念，可对账 |
| 进项 ↔ 成本 | AI 知道"供应商发票"和"成本"的关系，可计算订单利润 |

```text
用户问 AI："这个订单赚钱吗？"

AI 在语义层中找到路径：
  内部业务订单
    → 收入订单 → 销项发票（收入端）
    → 进项发票（成本端）
    → 代垫单（代垫成本）
  计算：收入 - 成本 - 代垫未收回 = 订单利润
```

### 23.6 语义层的渐进建设策略

语义层不需要一开始就完整。按里程碑逐步丰富：

| 阶段 | 语义层内容 |
|------|-----------|
| M1 基础框架 | 实体定义 + 核心字段（先覆盖客户、供应商、发票主表） |
| M2 销项结算 | + 收入订单实体、开票指标、客户维度 |
| M3 代垫关务 | + 代垫实体关系、代垫收回率指标 |
| M4 红冲作废 | + 红冲指标、发票生命周期维度 |
| M5 进项归档 | + 成本实体关系、进项认证率指标 |
| M6 风控报表 | + 风控指标、订单利润率、语义查询接口对外开放 |

---

## 24. 关键状态机

### 24.1 开票申请状态机

```text
DRAFT
  → READY
  → PENDING_APPROVAL
  → REJECTED
  → PENDING_ISSUE
  → ISSUING
  → ISSUED
  → DELIVERED
```

异常分支：

```text
ISSUING → ISSUE_FAILED → PENDING_ISSUE
DRAFT / READY / PENDING_APPROVAL → CANCELLED
ISSUED → PARTIALLY_RED_FLUSHED / RED_FLUSHED
ISSUED → VOIDED
```

### 24.2 红冲状态机

```text
DRAFT
  → PENDING_APPROVAL
  → PENDING_CONFIRM_FORM
  → WAITING_COUNTERPART_CONFIRM
  → CONFIRMED
  → RED_ISSUING
  → RED_ISSUED
  → COMPLETED
```

异常分支：

```text
WAITING_COUNTERPART_CONFIRM → CONFIRM_FORM_EXPIRED
WAITING_COUNTERPART_CONFIRM → REJECTED
RED_ISSUING → RED_FAILED
```

### 24.3 代垫状态机

```text
DRAFT
  → PENDING_CONFIRM
  → CONFIRMED
  → PENDING_COLLECTION
  → PARTIALLY_COLLECTED
  → COLLECTED
  → WRITTEN_OFF
```

异常分支：

```text
PENDING_CONFIRM → DISPUTED
DRAFT / PENDING_CONFIRM → CANCELLED
```

---

## 25. Mock 中心

### 25.1 功能目标

Mock 中心用于模拟外部系统行为，方便演示完整业务闭环。

### 25.2 Mock 功能

| Mock 项    | 说明              |
| --------- | --------------- |
| 模拟开票成功    | 生成发票号、税务流水号、PDF |
| 模拟开票失败    | 返回错误码           |
| 模拟查验成功    | 返回查验通过          |
| 模拟查验失败    | 返回查无此票、金额不符等    |
| 模拟红字确认    | 对方确认            |
| 模拟确认单超时   | 72 小时超时         |
| 模拟邮件交付    | 生成交付记录          |
| 模拟海关票据同步  | 生成缴款书           |
| 模拟 OCR    | 从文件名或模板生成结构化数据  |
| 模拟 ERP 回写 | 返回凭证号           |
| 模拟银行收款    | 返回收款流水          |

### 25.3 Mock 配置

| 配置      | 说明     |
| ------- | ------ |
| 开票成功率   | 默认 90% |
| 查验成功率   | 默认 95% |
| 交付成功率   | 默认 90% |
| 确认单自动确认 | 可开关    |
| 确认单自动超时 | 可开关    |
| 生成发票号规则 | 可配置    |
| 模拟延迟    | 0-5 秒  |
| 错误码模板   | 可配置    |

---

## 26. 审批流设计

### 26.1 审批场景

| 场景       | 审批规则          |
| -------- | ------------- |
| 开票申请     | 金额超过阈值需财务主管审批 |
| 红冲申请     | 全部需要审批        |
| 作废申请     | 全部需要审批        |
| 代垫确认     | 超过金额阈值需财务确认   |
| 代垫开票策略变更 | 需财务主管审批       |
| 风险阻断放行   | 需高权限审批        |
| 已归档资料变更  | 需审计/主管审批      |

### 26.2 审批字段

| 字段      | 说明 |
| ------- | -- |
| 审批单号    |    |
| 业务类型    |    |
| 业务单据 ID |    |
| 发起人     |    |
| 当前节点    |    |
| 当前处理人   |    |
| 审批状态    |    |
| 审批意见    |    |
| 审批时间    |    |
| 附件      |    |
| 日志      |    |

---

## 27. 操作日志与审计

所有关键动作必须记录日志：

| 动作 | 记录内容        |
| -- | ----------- |
| 创建 | 用户、时间、初始数据  |
| 修改 | 修改前、修改后     |
| 提交 | 提交人、提交时间    |
| 审批 | 审批人、意见      |
| 开票 | 请求参数摘要、模拟返回 |
| 红冲 | 原票、红票、金额    |
| 作废 | 作废原因、审批记录   |
| 查验 | 查验结果        |
| 交付 | 交付方式、收件人    |
| 下载 | 下载人、次数      |
| 归档 | 归档人、归档编号    |
| 导出 | 导出人、条件      |

---

## 28. 非功能需求

### 28.1 性能

| 场景          | 要求      |
| ----------- | ------- |
| 列表查询        | 2 秒内返回  |
| 单据详情        | 1 秒内返回  |
| Mock 开票     | 3 秒内完成  |
| 批量导入 1000 行 | 30 秒内处理 |
| 报表统计        | 5 秒内返回  |

### 28.2 安全

| 项    | 要求             |
| ---- | -------------- |
| 登录   | 账号密码，后续可扩展 SSO |
| 权限   | RBAC + 数据权限    |
| 敏感信息 | 税号、银行账号、手机号脱敏  |
| 文件   | 权限控制下载         |
| 操作日志 | 不可删除           |
| 接口   | 预留签名验签         |
| 数据   | 重要金额字段不可直接物理删除 |

### 28.3 可用性

1. 关键表单支持草稿。
2. 批量导入提供错误明细。
3. 所有审批可查看流程轨迹。
4. 所有发票可查看来源链路。
5. 所有异常状态提供处理建议。
6. 红冲、作废等高风险动作二次确认。

---

## 29. 验收标准

### 29.1 业务验收

| 模块 | 验收点                 |
| -- | ------------------- |
| 开票 | 能从结算单生成开票申请，并模拟开票成功 |
| 代垫 | 能创建代垫、确认、进入结算、收款核销  |
| 红冲 | 能对已开票发票发起全额/部分红冲    |
| 作废 | 能对可作废对象走作废流程        |
| 进项 | 能上传/录入进项票并模拟查验      |
| 海关 | 能录入海关缴款书并生成代垫       |
| 归档 | 能把发票和附件归档           |
| 风控 | 能识别重复、超额、抬头错误等风险    |
| 报表 | 能查看销项、进项、代垫、红冲、海关台账 |

### 29.2 技术验收

| 项    | 验收标准            |
| ---- | --------------- |
| API  | 所有核心操作通过 API 完成 |
| Mock | 外部接口均有 Mock 实现  |
| 权限   | 不同角色看到不同菜单和数据   |
| 日志   | 关键操作都有日志        |
| 状态机  | 状态流转符合规则        |
| 文件   | 发票模拟文件可上传、下载、预览 |
| 数据库  | 核心表结构稳定         |
| UI   | 页面可完整演示业务流程     |

---

## 30. 里程碑

### 第一阶段：基础框架与主数据

1. 登录与权限。
2. 首页工作台。
3. 客户、供应商、公司主体、税号。
4. 商品/服务项目、税收分类编码。
5. 文件上传和操作日志。

### 第二阶段：销项与结算

1. 业务订单。
2. 费用单。
3. 结算单。
4. 开票申请。
5. 模拟开票。
6. 模拟交付。

### 第三阶段：代垫与关务

1. 代垫单。
2. 海关缴款书。
3. 报关单关联。
4. 代垫进入结算。
5. 收款核销。

### 第四阶段：红冲与作废

1. 红冲申请。
2. 红字确认单。
3. 红字发票模拟。
4. 错票重开。
5. 作废申请。
6. 作废审批。

### 第五阶段：进项与归档

1. 进项发票录入。
2. Mock OCR。
3. Mock 查验。
4. 认证状态模拟。
5. 入账状态。
6. 电子档案。

### 第六阶段：风控与报表

1. 风控规则配置。
2. 风险结果中心。
3. 销项台账。
4. 进项台账。
5. 代垫报表。
6. 海关票据报表。
7. 红冲/作废报表。

---

## 31. 待确认问题

以下问题会影响后续原型细节：

1. 公司是否存在多个开票主体、多个税号？
2. 客户结算是按订单、按月、按报关单，还是多种并存？
3. 代垫费用在实际业务中通常是否开票？如果开票，是全额开票、差额开票，还是只开服务费？
4. 运输业务是公司自营运输，还是第三方运输转包？
5. 仓储业务是自有仓，还是第三方仓？
6. 半导体业务是否涉及保税仓、区内区外、一般贸易、进料加工等不同贸易方式？
7. 是否需要支持外币结算和汇率差异？
8. 是否已有 ERP、WMS、TMS、关务系统，后续需要对接哪些？
9. 发票审批是否已有固定层级？
10. 原型是否需要做客户门户，让客户查看发票、代垫、结算单？

---

## 32. 实际实现状态 (v1.1 原型)

> 本节记录原型 v1.1 的实际完成情况。v1.0 → v1.1 新增：销项/进项详情页与全页面编辑、列自定义拖拽排序、全部 UI 中文化、删除二次确认、业务订单详情页与全页面编辑。

### 32.1 里程碑完成情况

| 里程碑 | 状态 | 说明 |
|--------|------|------|
| M1 基础框架与主数据 | ✅ 完成 | 登录、工作台、客户、供应商、组织、税号、服务项目、税收编码、文件上传、操作日志 |
| M2 销项与结算 | ✅ 完成 | 业务订单、收入订单、费用项、结算单、开票申请、模拟开票、销项发票详情页 |
| M3 代垫与关务 | ✅ 完成 | 代垫单、海关缴款书、报关单关联、代垫入结算、收款核销 |
| M4 红冲与作废 | ✅ 完成 | 红冲申请、红冲确认单、红字发票模拟、作废申请与审批 |
| M5 进项与归档 | ✅ 完成 | 进项发票录入、Mock OCR、Mock 查验、进项发票全页面编辑 |
| M6 风控与报表 | ✅ 完成 | 风控规则配置、风险结果中心、销项/进项/代垫/海关/红冲/作废报表（占位页） |

### 32.2 技术实现与原计划差异

| 项 | 原计划 | 实际实现 | 原因 |
|----|--------|----------|------|
| 数据库 | PostgreSQL | **SQLite** (dev.db) | 原型阶段简化部署 |
| 枚举/JSON | Prisma enum + Json | **String** + 默认值 | SQLite 不支持 |
| 鉴权 | RBAC + 数据权限 | **Mock Credentials** (11 角色) | 原型阶段 |
| 中间件 | Next.js middleware | **无** | Turbopack edge runtime 冲突 |
| 状态管理 | Zustand | **TanStack Query + useState** | 简化 |
| 表格 | — | TanStack Table + **列拖拽排序/置顶/显隐** | 客户端列管理 |
| 审批流 | RBAC 审批 | **多级审批引擎** + 批量审批 | 4 工作流定义 |
| UI 语言 | 中英混合 | **全中文** | StatusBadge/币种/票种/状态全部中文化 |
| 删除操作 | 直接删除 | **ConfirmDialog 二次确认** | 15 个 CRUD 页面全覆盖 |
| 编辑方式 | Dialog 弹窗 | **全页面编辑**（业务订单/开票申请/进项发票） | 字段更完整、体验更好 |

### 32.3 种子数据覆盖

| 表 | 条数 | 说明 |
|----|------|------|
| Organization | 1 | 深圳半导体供应链有限公司 |
| User | 11 | 11 个角色全覆盖 |
| Customer | 5 | 华为/中芯国际/长鑫存储/华虹半导体/长江存储（含完整地址、银行、联系人） |
| Supplier | 5 | 顺丰/京东物流/中外运报关/中国外运/报关协会 |
| BusinessOrder | 5 | 含金额汇总、多币种(CNY+USD)、不同状态 |
| RevenueOrder | 12 | 每业务订单 2-3 条 |
| FeeItem | 15 | 关务/仓储/运输/代理各类费用 |
| AdvancePayment | 5 | 含 USD 多币种、不同收款/核销状态 |
| CustomsPaymentBook | 3 | 关税+进口增值税 |
| Settlement | 15 | 按季度、多客户 |
| OutputInvoiceApplication | 5 | DRAFT→PENDING_APPROVAL→ISSUED，含明细行 |
| OutputInvoice | 3 | 含发票号码/交付/查验状态 |
| InputInvoice | 5 | 含明细行 |
| RedFlushApplication | 2 | 全额+部分 |
| VoidApplication | 2 | 申请取消+旧票作废 |
| RiskResult | 3 | 低/中/高风险 |
| WorkflowDefinition | 4 | APPLICATION/RED_FLUSH/VOID/ADVANCE |
| WorkflowInstance | 2 | 含审批记录 |

### 32.4 语义层

| 文件 | 规模 | 说明 |
|------|------|------|
| `entities.json` | 22 实体 | 发票类/财务类/关务类/基础资料/业务类/风控类/审批类/归档类 |
| `relationships.json` | 22 关系 | 三锚点 + 全部业务管线 |
| `metrics.json` | 10 指标 | 开票总额/可开票余额/代垫收回率/进项认证率/红冲率/审批耗时等 |
| `index.ts` | 3 查询函数 | `findEntity()` / `findMetric()` / `getRelations()` |

### 32.5 页面清单（25 页）

| 分组 | 页面 | 编辑方式 | 详情页 | 删除确认 | 列设置 |
|------|------|----------|--------|----------|--------|
| 概览 | 工作台 /dashboard | — | — | — | — |
| 概览 | 审批中心 /approvals | Dialog 审批 | — | — | ✅ |
| 业务管理 | 业务订单 /business-orders | 全页面编辑 | ✅ | ✅ | ✅ |
| 业务管理 | 收入订单 /revenue-orders | Dialog + Select | — | ✅ | ✅ |
| 业务管理 | 费用管理 /fee-items | Dialog + 自动计算 | — | ✅ | ✅ |
| 业务管理 | 客户结算 /customer-settlements | Dialog + Select | — | ✅ | ✅ |
| 业务管理 | 销项发票 /invoices | — | ✅ | — | ✅ |
| 业务管理 | 开票申请 /applications | 全页面编辑 | ✅ | — | ✅ |
| 代垫关务 | 代垫管理 /advance-payments | Dialog + Select | — | ✅ | ✅ |
| 代垫关务 | 海关票据 /customs-payment-books | Dialog | — | ✅ | ✅ |
| 红冲作废 | 红冲管理 /red-flush | Dialog | — | ✅ | ✅ |
| 红冲作废 | 作废管理 /void-applications | Dialog | — | ✅ | ✅ |
| 进项归档 | 进项发票 /input-invoices | 全页面编辑 | — | ✅ | ✅ |
| 进项归档 | OCR 上传 /input-invoices/ocr | 全页拖拽 | — | — | — |
| 进项归档 | 付款申请 /payment-applications | Dialog | — | — | ✅ |
| 进项归档 | 电子档案 /archive-records | — | — | — | ✅ |
| 基础资料 | 客户管理 /customers | Dialog (11 字段) | — | ✅ | ✅ |
| 基础资料 | 供应商管理 /suppliers | Dialog (8 字段) | — | ✅ | ✅ |
| 基础资料 | 公司主体 /organizations | Dialog | — | ✅ | ✅ |
| 基础资料 | 税号管理 /tax-subjects | Dialog | — | ✅ | ✅ |
| 基础资料 | 服务项目 /invoice-items | Dialog | — | ✅ | ✅ |
| 基础资料 | 税收编码 /tax-codes | Dialog | — | ✅ | ✅ |
| 风控报表 | 风控中心 /risk-results | — | — | — | ✅ |
| 风控报表 | 报表分析 /reports | 占位 | — | — | — |

### 32.6 UI 中文化覆盖

| 类别 | 涉及文件 | 示例 |
|------|---------|------|
| 状态标签 | 15 页 | APPROVED→已通过、COLLECTED→已收款、DRAFT→草稿 |
| 币种 | 6 页 | CNY→人民币、USD→美元、HKD→港币 |
| 发票类别 | 3 页 | DIGITAL_SPECIAL→数电专票、VAT_SPECIAL→增值税专票 |
| 费用类型 | 5 页 | CUSTOMS_DUTY→关税、IMPORT_VAT→进口增值税 |
| 录入方式 | 3 页 | MANUAL→手工录入、OCR→OCR 识别 |
| 风险等级 | 1 页 | LOW→低风险、CRITICAL→严重风险 |
| 审批状态 | 1 页 | IN_PROGRESS→审批中、REJECTED→已驳回 |
| 按钮文本 | 全部 | Play▶→开票、Eye👁→查看、Pencil✏→编辑 |

### 32.7 v1.1 新增功能

- **销项发票详情页** `/invoices/[id]`：发票信息+金额+状态+明细+时间
- **开票申请全页面编辑** `/applications/[id]/edit`：Card 分区布局+动态明细行
- **进项发票全页面编辑** `/input-invoices/[id]/edit`：发票+金额+关联信息
- **列设置拖拽排序**：所有 DataTable 支持拖拽/箭头/置顶/显隐
- **删除二次确认**：15 个 CRUD 页面全部加入 ConfirmDialog
- **全部 UI 中文化**：StatusBadge/币种/票种/状态/费用类型/录入方式/按钮

### 32.8 未实现项（后续迭代）

- 真实税务开票对接（金税/乐企）
- 真实 OCR / 查验 / 认证
- Excel 导入导出
- 服务端分页与搜索
- 报表页面实际数据渲染
- middleware.ts（Turbopack 兼容问题待解决）
- E2E 测试
- 客户门户
- DropdownMenu/Button 嵌套 hydration 修复（Header 组件）

---

## 33. 本 PRD 的核心产品结论

本系统应定位为：

**半导体供应链业务发票中台，而不是单一开票工具。**

核心设计应围绕：

```text
业务订单
  → 费用发生
  → 代垫归集
  → 客户结算
  → 开票申请
  → 模拟开票
  → 交付
  → 红冲/作废
  → 收款/核销
  → 入账
  → 归档
```

对开发而言，最重要的是先搭好 **"三锚点 + 四状态机 + 一适配层"**：

**三大业务锚点（业财税一体化的骨架）：**

1. **代垫 ↔ 内部订单**：代垫单必须关联内部业务订单，订单维度可汇总代垫金额、收回状态。订单关闭前校验代垫核销完毕。
2. **销项 ↔ 收入订单**：销项发票必须关联收入订单/结算单。收入订单维护"可开票余额"，开票金额不得超出。红冲后余额回退。三层金额校验：收入订单 ≥ 结算单 ≥ 销项发票。
3. **进项 ↔ 成本对象**：进项发票必须关联成本中心或业务订单。支持成本归集、代垫成本标记、订单维度利润率计算。

**四状态机：**

4. 开票申请状态机。
5. 红冲状态机（含红字确认单生命周期）。
6. 作废状态机（含开票申请取消、传统票据作废、代开发票作废）。
7. 代垫状态机（含收款、核销、争议）。

**一适配层：**

8. Mock 外部接口适配层（税务通道、查验、交付、海关、OCR、ERP 回写）。
9. 完整操作日志和归档链路。

```text
内部业务订单
  ├── 代垫锚点 → 代垫单 → 客户确认 → 结算 → 收款核销
  ├── 收入锚点 → 收入订单 → 结算单 → 开票申请 → 销项发票 → 交付
  └── 成本锚点 ← 进项发票 ← 供应商 ← 成本归集 ← 利润分析
```

这样即使当前不接真实生产系统，后续也可以平滑扩展到真实税务、ERP、WMS、TMS、关务系统。
