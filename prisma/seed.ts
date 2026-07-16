import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

// ── helpers ──────────────────────────────────────────────
function d(s: string) {
  return new Date(s);
}
function money(v: number) {
  return v;
}

async function main() {
  console.log("=== Seeding 半导体供应链发票管理系统 ===\n");

  // ═══════════════════════════════════════════════════════
  // 1. ORGANIZATION
  // ═══════════════════════════════════════════════════════
  const org = await db.organization.create({
    data: {
      id: "org-default",
      name: "深圳半导体供应链有限公司",
      shortName: "深圳半导体",
      code: "SZ-SEMI-001",
      description: "专注于半导体行业进出口供应链服务，提供关务、仓储、运输一站式解决方案",
    },
  });
  console.log("[org] " + org.name);

  // ═══════════════════════════════════════════════════════
  // 2. USERS (11 roles)
  // ═══════════════════════════════════════════════════════
  const userDefs = [
    { name: "系统管理员", email: "admin@invoice.local", passwordHash: "admin123", role: "admin" },
    { name: "财务主管", email: "finance@invoice.local", passwordHash: "finance123", role: "finance_manager" },
    { name: "开票员", email: "operator@invoice.local", passwordHash: "operator123", role: "operator" },
    { name: "应收会计", email: "ar@invoice.local", passwordHash: "ar123", role: "ar_accountant" },
    { name: "应付会计", email: "ap@invoice.local", passwordHash: "ap123", role: "ap_accountant" },
    { name: "税务专员", email: "tax@invoice.local", passwordHash: "tax123", role: "tax_specialist" },
    { name: "关务专员", email: "customs@invoice.local", passwordHash: "customs123", role: "customs_specialist" },
    { name: "仓储专员", email: "wh@invoice.local", passwordHash: "wh123", role: "warehouse_specialist" },
    { name: "运输专员", email: "transport@invoice.local", passwordHash: "transport123", role: "transport_specialist" },
    { name: "业务经理", email: "biz@invoice.local", passwordHash: "biz123", role: "business_manager" },
    { name: "审计员", email: "audit@invoice.local", passwordHash: "audit123", role: "auditor" },
  ];
  const users: Record<string, string> = {};
  for (const u of userDefs) {
    const r = await db.user.create({ data: { ...u, organizationId: org.id } });
    users[u.role] = r.id;
  }
  console.log(`[users] ${userDefs.length} users`);

  // ═══════════════════════════════════════════════════════
  // 3. TAX SUBJECTS
  // ═══════════════════════════════════════════════════════
  const taxSubject = await db.taxSubject.create({
    data: {
      name: "深圳半导体供应链有限公司",
      taxNo: "91440300MA5ABCD123",
      address: "深圳市南山区科技园南路18号半导体大厦",
      phone: "0755-86661234",
      bankName: "招商银行深圳南山支行",
      bankAccount: "7559123456789",
      organizationId: org.id,
      isDefault: true,
    },
  });
  console.log("[tax] " + taxSubject.name);

  // Tax subject bank accounts (multiple per tax subject)
  const bankAccounts = [
    { taxSubjectId: taxSubject.id, bankName: "招商银行深圳南山支行", bankAccount: "7559123456789", isDefault: true },
    { taxSubjectId: taxSubject.id, bankName: "中国工商银行深圳分行", bankAccount: "4000023409200123456", isDefault: false },
    { taxSubjectId: taxSubject.id, bankName: "中国银行深圳科技园支行", bankAccount: "6217002000123456789", isDefault: false },
  ];
  for (const ba of bankAccounts) {
    await db.taxSubjectBankAccount.create({ data: ba });
  }
  console.log("[bank] " + bankAccounts.length + " bank accounts created");

  // Second tax subject (上海公司)
  const taxSubject2 = await db.taxSubject.create({
    data: {
      name: "上海泓明国际货运有限公司",
      taxNo: "91310000132248358N",
      address: "中国（上海）自由贸易试验区富特西三路77号6幢3层302室",
      phone: "021-58661234",
      bankName: "招商银行股份有限公司上海淮海支行",
      bankAccount: "121902001810903",
      organizationId: org.id,
    },
  });
  const bankAccounts2 = [
    { taxSubjectId: taxSubject2.id, bankName: "招商银行股份有限公司上海淮海支行", bankAccount: "121902001810903", isDefault: true },
    { taxSubjectId: taxSubject2.id, bankName: "中国工商银行上海外高桥支行", bankAccount: "1001173429200654321", isDefault: false },
  ];
  for (const ba of bankAccounts2) {
    await db.taxSubjectBankAccount.create({ data: ba });
  }
  console.log("[tax] " + taxSubject2.name + " (+2 bank accounts)");

  // ═══════════════════════════════════════════════════════
  // 4. CUSTOMERS (5)
  // ═══════════════════════════════════════════════════════
  const customerDefs = [
    {
      name: "华为技术有限公司",
      shortName: "华为",
      taxNo: "91440300100000000X",
      address: "深圳市龙岗区坂田华为基地",
      phone: "0755-28780888",
      bankName: "招商银行深圳分行",
      bankAccount: "1234567890123456",
      contactPerson: "王经理",
      contactPhone: "13800138001",
      contactEmail: "wang.wm@huawei.com",
      invoiceStrategy: "MERGE_WITH_SERVICE",
    },
    {
      name: "中芯国际集成电路制造有限公司",
      shortName: "中芯国际",
      taxNo: "91310000600000000Y",
      address: "上海市浦东新区张江路18号",
      phone: "021-50801234",
      bankName: "工商银行上海张江支行",
      bankAccount: "1001234567890123",
      contactPerson: "李经理",
      contactPhone: "13800138002",
      contactEmail: "li.fang@smic.com",
      invoiceStrategy: "SEPARATE_INVOICE",
    },
    {
      name: "长鑫存储技术有限公司",
      shortName: "长鑫存储",
      taxNo: "91340000700000000Z",
      address: "合肥市经济技术开发区翠微路6号",
      phone: "0551-63581234",
      bankName: "建设银行合肥经开区支行",
      bankAccount: "3401234567890123",
      contactPerson: "张经理",
      contactPhone: "13800138003",
      contactEmail: "zhang.wei@cxmt.com",
      invoiceStrategy: "SERVICE_ONLY",
    },
    {
      name: "华虹半导体有限公司",
      shortName: "华虹半导体",
      taxNo: "91310000800000000A",
      address: "上海市浦东新区金桥出口加工区金豫路818号",
      phone: "021-50181234",
      bankName: "中国银行上海金桥支行",
      bankAccount: "4538123456789012",
      contactPerson: "赵经理",
      contactPhone: "13912345678",
      contactEmail: "zhao.lei@huahong.com",
      invoiceStrategy: "MANUAL",
    },
    {
      name: "长江存储科技有限责任公司",
      shortName: "长江存储",
      taxNo: "91420000900000000B",
      address: "武汉市东湖新技术开发区未来三路88号",
      phone: "027-87161234",
      bankName: "农业银行武汉光谷支行",
      bankAccount: "1701234567890123",
      contactPerson: "刘经理",
      contactPhone: "13612345678",
      contactEmail: "liu.yun@ymtc.com",
      invoiceStrategy: "NET_AMOUNT",
    },
  ];
  const customers: Record<string, string> = {};
  for (const c of customerDefs) {
    const r = await db.customer.create({ data: { ...c, organizationId: org.id } });
    customers[c.shortName!] = r.id;
  }
  console.log(`[customers] ${customerDefs.length} customers`);

  // ═══════════════════════════════════════════════════════
  // 5. SUPPLIERS (5)
  // ═══════════════════════════════════════════════════════
  const supplierDefs = [
    {
      name: "顺丰速运有限公司",
      shortName: "顺丰",
      taxNo: "91440300200000000A",
      address: "深圳市宝安区福永街道顺丰路1号",
      phone: "95338",
      bankName: "招商银行深圳宝安支行",
      bankAccount: "7559876543210",
      contactPerson: "陈经理",
      contactPhone: "13712345678",
      contactEmail: "chen.jie@sf-express.com",
      supplierType: "transport",
    },
    {
      name: "京东物流集团",
      shortName: "京东物流",
      taxNo: "91110000300000000B",
      address: "北京市亦庄经济开发区科创十一街18号",
      phone: "950616",
      bankName: "工商银行北京亦庄支行",
      bankAccount: "2001234567890123",
      contactPerson: "周经理",
      contactPhone: "13512345678",
      contactEmail: "zhou.wei@jdwl.com",
      supplierType: "warehouse",
    },
    {
      name: "中外运报关有限公司",
      shortName: "中外运报关",
      taxNo: "91310000400000000C",
      address: "上海市虹口区东大名路359号",
      phone: "021-63211234",
      bankName: "交通银行上海虹口支行",
      bankAccount: "3101234567890123",
      contactPerson: "林经理",
      contactPhone: "13312345678",
      contactEmail: "lin.jian@sinotrans.com",
      supplierType: "customs",
    },
    {
      name: "中国外运股份有限公司",
      shortName: "中国外运",
      taxNo: "91110000500000000D",
      address: "北京市海淀区西直门外大街168号",
      phone: "010-62281234",
      bankName: "中国银行北京海淀支行",
      bankAccount: "3201234567890123",
      contactPerson: "吴经理",
      contactPhone: "13112345678",
      contactEmail: "wu.gang@sinotrans.com",
      supplierType: "logistics",
    },
    {
      name: "深圳市报关协会服务中心",
      shortName: "报关协会",
      taxNo: "91440300600000000E",
      address: "深圳市福田区深南大道2008号",
      phone: "0755-83801234",
      bankName: "平安银行深圳福田支行",
      bankAccount: "4101234567890123",
      contactPerson: "黄经理",
      contactPhone: "13412345678",
      contactEmail: "huang.li@szcba.org",
      supplierType: "agency",
    },
  ];
  const suppliers: Record<string, string> = {};
  for (const s of supplierDefs) {
    const r = await db.supplier.create({ data: { ...s, organizationId: org.id } });
    suppliers[s.shortName!] = r.id;
  }
  console.log(`[suppliers] ${supplierDefs.length} suppliers`);

  // ═══════════════════════════════════════════════════════
  // 6. COST CENTERS
  // ═══════════════════════════════════════════════════════
  const ccDefs = [
    { name: "关务部", code: "CC-CUSTOMS", manager: "赵主管", description: "报关、报检、关务咨询" },
    { name: "仓储部", code: "CC-WAREHOUSE", manager: "钱主管", description: "保税仓/普通仓管理" },
    { name: "运输部", code: "CC-TRANSPORT", manager: "孙主管", description: "中港运输、国内配送" },
    { name: "代理部", code: "CC-AGENCY", manager: "李主管", description: "进出口代理、单证服务" },
    { name: "综合管理部", code: "CC-ADMIN", manager: "周主管", description: "行政、财务、IT支持" },
  ];
  const costCenters: Record<string, string> = {};
  for (const cc of ccDefs) {
    const r = await db.costCenter.create({ data: { ...cc, organizationId: org.id } });
    costCenters[cc.code] = r.id;
  }
  console.log(`[cost_centers] ${ccDefs.length} cost centers`);

  // ═══════════════════════════════════════════════════════
  // 7. TAX CODES
  // ═══════════════════════════════════════════════════════
  const taxCodeDefs = [
    { code: "304030101", name: "关务服务", description: "报关、报检、关务咨询服务", taxRate: 6 },
    { code: "304030201", name: "仓储服务", description: "货物仓储、库存管理服务", taxRate: 6 },
    { code: "301010201", name: "国内货物运输服务", description: "国内公路/铁路/航空货物运输", taxRate: 9 },
    { code: "304030301", name: "代理服务", description: "供应链管理、进出口代理服务", taxRate: 6 },
    { code: "301030101", name: "国际货物运输服务", description: "国际海运/空运货物运输代理", taxRate: 0 },
    { code: "304010101", name: "技术服务费", description: "技术咨询、系统服务", taxRate: 6 },
  ];
  for (const tc of taxCodeDefs) await db.taxCode.create({ data: tc });
  console.log(`[tax_codes] ${taxCodeDefs.length} tax codes`);

  // ═══════════════════════════════════════════════════════
  // 8. INVOICE ITEMS
  // ═══════════════════════════════════════════════════════
  const itemDefs = [
    { name: "关务服务费", taxCode: "304030101", unit: "票", category: "关务", spec: "含报关+报检" },
    { name: "仓储服务费", taxCode: "304030201", unit: "CBM/天", category: "仓储", spec: "恒温恒湿仓" },
    { name: "运输服务费", taxCode: "301010201", unit: "车次", category: "运输", spec: "中港吨车" },
    { name: "代理服务费", taxCode: "304030301", unit: "票", category: "代理", spec: "进出口全流程" },
    { name: "国际货代费", taxCode: "301030101", unit: "票", category: "国际", spec: "FOB/CIF" },
    { name: "技术咨询费", taxCode: "304010101", unit: "次", category: "技术", spec: "关务系统对接" },
  ];
  for (const item of itemDefs) await db.invoiceItem.create({ data: item });
  console.log(`[invoice_items] ${itemDefs.length} items`);

  // ═══════════════════════════════════════════════════════
  // 9. BUSINESS ORDERS (5) + REVENUE ORDERS (12)
  // ═══════════════════════════════════════════════════════
  const boDefs = [
    {
      orderNo: "SO-2026-0001", orderType: "COMPREHENSIVE",
      title: "华为2026年度综合供应链服务合同",
      customer: "华为", status: "ACTIVE",
      totalAdvance: 200000, collectedAdvance: 180000,
      totalRevenue: 1500000, invoiced: 800000,
      currency: "CNY", start: "2026-01-01", end: "2026-12-31",
      remark: "华为年度框架协议，含关务+仓储+运输全链条服务",
    },
    {
      orderNo: "SO-2026-0002", orderType: "COMPREHENSIVE",
      title: "中芯国际2026年度供应链服务合同",
      customer: "中芯国际", status: "ACTIVE",
      totalAdvance: 500000, collectedAdvance: 350000,
      totalRevenue: 3200000, invoiced: 1200000,
      currency: "CNY", start: "2026-01-01", end: "2026-12-31",
      remark: "中芯国际年度合同，含进口设备关务+保税仓+配送",
    },
    {
      orderNo: "SO-2026-0003", orderType: "COMPREHENSIVE",
      title: "长鑫存储2026Q2-Q4供应链服务合同",
      customer: "长鑫存储", status: "DRAFT",
      totalAdvance: 0, collectedAdvance: 0,
      totalRevenue: 800000, invoiced: 0,
      currency: "CNY", start: "2026-04-01", end: "2027-03-31",
      remark: "新签客户，预计Q2启动服务",
    },
    {
      orderNo: "SO-2026-0004", orderType: "COMPREHENSIVE",
      title: "华虹半导体2026年设备进口关务服务",
      customer: "华虹半导体", status: "ACTIVE",
      totalAdvance: 150000, collectedAdvance: 120000,
      totalRevenue: 1200000, invoiced: 600000,
      currency: "USD", start: "2026-03-01", end: "2026-09-30",
      remark: "华虹设备进口项目，USD结算",
    },
    {
      orderNo: "SO-2026-0005", orderType: "COMPREHENSIVE",
      title: "长江存储2026H2物流配送服务合同",
      customer: "长江存储", status: "DRAFT",
      totalAdvance: 0, collectedAdvance: 0,
      totalRevenue: 500000, invoiced: 0,
      currency: "CNY", start: "2026-07-01", end: "2027-06-30",
      remark: "下半年启动，以运输配送为主",
    },
  ];
  const bizOrders: Record<string, { id: string; revenueOrders: Record<string, string> }> = {};

  for (const bo of boDefs) {
    const av = bo.totalRevenue - bo.invoiced;
    const uncollected = bo.totalAdvance - bo.collectedAdvance;
    const r = await db.businessOrder.create({
      data: {
        orderNo: bo.orderNo,
        orderType: bo.orderType,
        title: bo.title,
        customerId: customers[bo.customer]!,
        organizationId: org.id,
        status: bo.status,
        totalAdvanceAmount: money(bo.totalAdvance),
        collectedAdvanceAmount: money(bo.collectedAdvance),
        uncollectedAdvanceAmount: money(uncollected),
        totalRevenueAmount: money(bo.totalRevenue),
        invoicedAmount: money(bo.invoiced),
        availableAmount: money(av),
        currency: bo.currency,
        startDate: d(bo.start),
        endDate: d(bo.end),
        remark: bo.remark,
      },
    });
    bizOrders[bo.orderNo] = { id: r.id, revenueOrders: {} };

    // Revenue orders per business order
    const roCount = bo.orderNo === "SO-2026-0001" ? 3 : bo.orderNo === "SO-2026-0002" ? 3 : 2;
    for (let i = 0; i < roCount; i++) {
      const roNo = `RO-${bo.orderNo.slice(3)}-${String(i + 1).padStart(2, "0")}`;
      const totalRev = Math.round((bo.totalRevenue / roCount) * (0.8 + Math.random() * 0.4));
      const invoicedAmt = bo.status === "DRAFT" ? 0 : Math.round(totalRev * (0.3 + Math.random() * 0.5));
      const titles = ["关务服务", "仓储服务", "运输配送"];
      const ro = await db.revenueOrder.create({
        data: {
          orderNo: roNo,
          title: `${bo.title} - ${titles[i] ?? "综合服务"}`,
          businessOrderId: r.id,
          customerId: customers[bo.customer]!,
          totalRevenueAmount: money(totalRev),
          invoicedAmount: money(invoicedAmt),
          availableAmount: money(totalRev - invoicedAmt),
          invoiceStatus: invoicedAmt === 0 ? "NOT_INVOICED" : invoicedAmt < totalRev ? "PARTIALLY" : "INVOICED",
          currency: bo.currency,
          startDate: d(bo.start),
          endDate: d(bo.end),
        },
      });
      bizOrders[bo.orderNo]!.revenueOrders[roNo] = ro.id;
    }
  }
  console.log(`[biz_orders] ${boDefs.length} business orders + 12 revenue orders`);

  // ═══════════════════════════════════════════════════════
  // 10. FEE ITEMS (~15)
  // ═══════════════════════════════════════════════════════
  const feeItemDefs = [
    { biz: "SO-2026-0001", feeNo: "FEE-2026-0001", feeType: "CUSTOMS_SERVICE", desc: "华为Q1进口设备报关费", qty: 5, price: 10000, curr: "CNY", rate: 1, date: "2026-03-15" },
    { biz: "SO-2026-0001", feeNo: "FEE-2026-0002", feeType: "WAREHOUSE_SERVICE", desc: "华为保税仓Q1仓储费", qty: 3, price: 10000, curr: "CNY", rate: 1, date: "2026-03-31" },
    { biz: "SO-2026-0001", feeNo: "FEE-2026-0003", feeType: "TRANSPORT_SERVICE", desc: "华为Q1中港运输费", qty: 10, price: 2000, curr: "CNY", rate: 1, date: "2026-03-20" },
    { biz: "SO-2026-0002", feeNo: "FEE-2026-0004", feeType: "CUSTOMS_SERVICE", desc: "中芯国际设备进口报关", qty: 8, price: 12000, curr: "CNY", rate: 1, date: "2026-04-10" },
    { biz: "SO-2026-0002", feeNo: "FEE-2026-0005", feeType: "WAREHOUSE_SERVICE", desc: "中芯国际保税仓Q2仓储", qty: 6, price: 8000, curr: "CNY", rate: 1, date: "2026-04-15" },
    { biz: "SO-2026-0002", feeNo: "FEE-2026-0006", feeType: "TRANSPORT_SERVICE", desc: "中芯国际国内配送", qty: 15, price: 3000, curr: "CNY", rate: 1, date: "2026-05-01" },
    { biz: "SO-2026-0002", feeNo: "FEE-2026-0007", feeType: "AGENCY_SERVICE", desc: "中芯国际进出口代理费", qty: 1, price: 50000, curr: "USD", rate: 7.15, date: "2026-04-20" },
    { biz: "SO-2026-0003", feeNo: "FEE-2026-0008", feeType: "CUSTOMS_SERVICE", desc: "长鑫存储项目前期报关咨询", qty: 2, price: 15000, curr: "CNY", rate: 1, date: "2026-05-15" },
    { biz: "SO-2026-0003", feeNo: "FEE-2026-0009", feeType: "WAREHOUSE_SERVICE", desc: "长鑫存储仓储方案设计", qty: 1, price: 30000, curr: "CNY", rate: 1, date: "2026-05-20" },
    { biz: "SO-2026-0004", feeNo: "FEE-2026-0010", feeType: "CUSTOMS_SERVICE", desc: "华虹光刻机进口报关", qty: 3, price: 20000, curr: "USD", rate: 7.15, date: "2026-04-01" },
    { biz: "SO-2026-0004", feeNo: "FEE-2026-0011", feeType: "TRANSPORT_SERVICE", desc: "华虹设备超限运输", qty: 2, price: 30000, curr: "USD", rate: 7.15, date: "2026-04-10" },
    { biz: "SO-2026-0004", feeNo: "FEE-2026-0012", feeType: "AGENCY_SERVICE", desc: "华虹进口许可证代办", qty: 1, price: 25000, curr: "USD", rate: 7.15, date: "2026-03-20" },
    { biz: "SO-2026-0005", feeNo: "FEE-2026-0013", feeType: "TRANSPORT_SERVICE", desc: "长江存储晶圆配送方案", qty: 5, price: 8000, curr: "CNY", rate: 1, date: "2026-07-05" },
    { biz: "SO-2026-0005", feeNo: "FEE-2026-0014", feeType: "WAREHOUSE_SERVICE", desc: "长江存储中转仓租赁", qty: 3, price: 6000, curr: "CNY", rate: 1, date: "2026-07-10" },
    { biz: "SO-2026-0001", feeNo: "FEE-2026-0015", feeType: "AGENCY_SERVICE", desc: "华为进出口许可证年审", qty: 1, price: 20000, curr: "CNY", rate: 1, date: "2026-06-01" },
  ];
  for (const fi of feeItemDefs) {
    await db.feeItem.create({
      data: {
        feeNo: fi.feeNo,
        businessOrderId: bizOrders[fi.biz]!.id,
        feeType: fi.feeType,
        description: fi.desc,
        quantity: money(fi.qty),
        unitPrice: money(fi.price),
        amount: money(fi.qty * fi.price),
        currency: fi.curr,
        exchangeRate: money(fi.rate),
        baseAmount: money(fi.qty * fi.price * fi.rate),
        occurredDate: d(fi.date),
        isInvoiced: ["SO-2026-0003", "SO-2026-0005"].includes(fi.biz) ? false : Math.random() > 0.5,
      },
    });
  }
  console.log(`[fee_items] ${feeItemDefs.length} fee items`);

  // ═══════════════════════════════════════════════════════
  // 11. ADVANCE PAYMENTS (5)
  // ═══════════════════════════════════════════════════════
  // 10 records from CBMS C11 (2026-07-16)
  const advDefs = [
    { advanceNo:"P-26070179", zone:"PAC", feeType:"仓储费", curr:"CNY", origAmt:188.89, bizNo:"PAC-ANJI26070001D", mawb:"873963208746", remark:"873963208746仓储费", collStatus:"COLLECTED" },
    { advanceNo:"P-26070178", zone:"ZHJ", feeType:"仓储费", curr:"CNY", origAmt:1347.30, bizNo:"ZHJ-CTPT26070011J", mawb:"KFB-00955753", remark:"ZHJ-CTPT26070011J", collStatus:"COLLECTED" },
    { advanceNo:"P-26070177", zone:"ZHJ", feeType:"换单费", curr:"CNY", origAmt:350.00, bizNo:"ZHJ-XSBDT26070018D", mawb:"", remark:"", collStatus:"COLLECTED" },
    { advanceNo:"P-26070176", zone:"ZHJ", feeType:"换单费", curr:"CNY", origAmt:3100.00, bizNo:"ZHJ-XSBDT26070018D", mawb:"", remark:"", collStatus:"WRITTEN_OFF" },
    { advanceNo:"P-26070175", zone:"ZHJ", feeType:"换单费", curr:"CNY", origAmt:8160.00, bizNo:"ZHJ-XSBDT26070017D", mawb:"", remark:"", collStatus:"COLLECTED" },
    { advanceNo:"P-26070174", zone:"ZHJ", feeType:"换单费", curr:"CNY", origAmt:4405.00, bizNo:"ZHJ-XSBDT26070016D", mawb:"", remark:"", collStatus:"COLLECTED" },
    { advanceNo:"P-26070173", zone:"CAN", feeType:"换单费", curr:"CNY", origAmt:424.00, bizNo:"CAN-CANSEMI26070020Y", mawb:"20576555990_123018792092", remark:"", collStatus:"COLLECTED" },
    { advanceNo:"P-26070172", zone:"CAN", feeType:"换单费", curr:"CNY", origAmt:424.00, bizNo:"CAN-CANSEMI26070019Y", mawb:"20576555382_123018792081", remark:"", collStatus:"COLLECTED" },
    { advanceNo:"P-26070171", zone:"CAN", feeType:"换单费", curr:"CNY", origAmt:424.00, bizNo:"CAN-ZENSEMI26070018D", mawb:"20576478231_123019130391", remark:"", collStatus:"COLLECTED" },
    { advanceNo:"P-26070170", zone:"CAN", feeType:"换单费", curr:"CNY", origAmt:424.00, bizNo:"CAN-ZENSEMI26070017D", mawb:"20576555846_123018792114", remark:"", collStatus:"COLLECTED" },
  ];
  const advancePayments: Record<string, string> = {};
  for (const adv of advDefs) {
    const r = await db.advancePayment.create({
      data: {
        advanceNo: adv.advanceNo,
        organizationId: "org-default",
        zone: adv.zone,
        feeType: adv.feeType,
        occurredDate: new Date("2026-07-16"),
        currency: adv.curr,
        originalAmount: money(adv.origAmt),
        businessOrderNo: adv.bizNo || null,
        mawbNo: adv.mawb || null,
        remark: adv.remark || null,
        collectionStatus: adv.collStatus,
        writeOffStatus: "PENDING",
        status: "CONFIRMED",
        createdBy: null,
      },
    });
    advancePayments[adv.advanceNo] = r.id;
  }
  console.log(`[advances] ${advDefs.length} advance payments`);

  // ═══════════════════════════════════════════════════════
  // 12. CUSTOMS PAYMENT BOOKS (3)
  // ═══════════════════════════════════════════════════════
  const cpbDefs = [
    {
      bookNo: "CPB-2026-0001", bookType: "CUSTOMS_DUTY_PAYMENT", taxType: "CUSTOMS_DUTY",
      paymentNo: "TAX-20260310-001", customsDeclNo: "CD-2026-00001",
      importPort: "深圳海关", declUnit: "深圳半导体供应链有限公司", consUnit: "华为技术有限公司",
      taxpayer: "深圳半导体供应链有限公司", taxpayerNo: "91440300MA5ABCD123",
      taxAmt: 80000, payDate: "2026-03-15", curr: "CNY",
      isAdvance: true, advNo: "P-26070179",
    },
    {
      bookNo: "CPB-2026-0002", bookType: "IMPORT_VAT_PAYMENT", taxType: "IMPORT_VAT",
      paymentNo: "TAX-20260312-001", customsDeclNo: "CD-2026-00002",
      importPort: "深圳海关", declUnit: "深圳半导体供应链有限公司", consUnit: "华为技术有限公司",
      taxpayer: "深圳半导体供应链有限公司", taxpayerNo: "91440300MA5ABCD123",
      taxAmt: 120000, payDate: "2026-03-18", curr: "CNY",
      isAdvance: true, advNo: "P-26070178",
    },
    {
      bookNo: "CPB-2026-0003", bookType: "CUSTOMS_DUTY_PAYMENT", taxType: "CUSTOMS_DUTY",
      paymentNo: "TAX-20260405-001", customsDeclNo: "CD-2026-00003",
      importPort: "上海海关", declUnit: "深圳半导体供应链有限公司", consUnit: "中芯国际集成电路制造有限公司",
      taxpayer: "深圳半导体供应链有限公司", taxpayerNo: "91440300MA5ABCD123",
      taxAmt: 250000, payDate: "2026-04-10", curr: "CNY",
      isAdvance: true, advNo: "P-26070177",
    },
  ];
  for (const cpb of cpbDefs) {
    await db.customsPaymentBook.create({
      data: {
        bookNo: cpb.bookNo,
        bookType: cpb.bookType,
        taxType: cpb.taxType,
        paymentNo: cpb.paymentNo,
        customsDeclarationNo: cpb.customsDeclNo,
        importPort: cpb.importPort,
        declarationUnit: cpb.declUnit,
        consumerUnit: cpb.consUnit,
        taxpayerName: cpb.taxpayer,
        taxpayerTaxNo: cpb.taxpayerNo,
        taxAmount: money(cpb.taxAmt),
        paymentDate: d(cpb.payDate),
        currency: cpb.curr,
        isAdvance: cpb.isAdvance,
        advancePaymentId: advancePayments[cpb.advNo] ?? null,
        deductStatus: "DEDUCTED",
      },
    });
  }
  console.log(`[customs] ${cpbDefs.length} customs payment books`);

  // ═══════════════════════════════════════════════════════
  // 13. SETTLEMENTS (3 per customer = 15)
  // ═══════════════════════════════════════════════════════
  const settlementIds: string[] = [];
  const settlementDefs = [
    { no: "STL-2026-0001", cust: "华为", ro: "RO-0001-01", title: "华为2026Q1关务服务结算", total: 180000, invoiced: 180000, received: 180000, status: "SETTLED", ps: "2026-01-01", pe: "2026-03-31" },
    { no: "STL-2026-0002", cust: "华为", ro: "RO-0001-02", title: "华为2026Q1仓储服务结算", total: 120000, invoiced: 120000, received: 100000, status: "CONFIRMED", ps: "2026-01-01", pe: "2026-03-31" },
    { no: "STL-2026-0003", cust: "华为", ro: "RO-0001-03", title: "华为2026Q1运输服务结算", total: 150000, invoiced: 80000, received: 80000, status: "DRAFT", ps: "2026-01-01", pe: "2026-03-31" },
    { no: "STL-2026-0004", cust: "中芯国际", ro: "RO-0002-01", title: "中芯国际2026Q2关务结算", total: 280000, invoiced: 280000, received: 250000, status: "CONFIRMED", ps: "2026-04-01", pe: "2026-06-30" },
    { no: "STL-2026-0005", cust: "中芯国际", ro: "RO-0002-02", title: "中芯国际2026Q2仓储结算", total: 200000, invoiced: 150000, received: 150000, status: "CONFIRMED", ps: "2026-04-01", pe: "2026-06-30" },
    { no: "STL-2026-0006", cust: "中芯国际", ro: "RO-0002-03", title: "中芯国际2026Q2运输结算", total: 160000, invoiced: 0, received: 0, status: "DRAFT", ps: "2026-04-01", pe: "2026-06-30" },
    { no: "STL-2026-0007", cust: "华虹半导体", ro: "RO-0004-01", title: "华虹2026Q1设备进口关务结算", total: 350000, invoiced: 350000, received: 300000, status: "SETTLED", ps: "2026-03-01", pe: "2026-05-31" },
    { no: "STL-2026-0008", cust: "华虹半导体", ro: "RO-0004-02", title: "华虹2026Q1设备运输结算", total: 250000, invoiced: 250000, received: 250000, status: "SETTLED", ps: "2026-03-01", pe: "2026-05-31" },
    { no: "STL-2026-0009", cust: "长鑫存储", ro: "RO-0003-01", title: "长鑫存储Q2前期咨询结算", total: 60000, invoiced: 30000, received: 30000, status: "DRAFT", ps: "2026-04-01", pe: "2026-06-30" },
    { no: "STL-2026-0010", cust: "长江存储", ro: "RO-0005-01", title: "长江存储Q3物流方案结算", total: 80000, invoiced: 0, received: 0, status: "DRAFT", ps: "2026-07-01", pe: "2026-09-30" },
    { no: "STL-2026-0011", cust: "华为", ro: "RO-0001-01", title: "华为2026Q2关务服务结算", total: 200000, invoiced: 100000, received: 100000, status: "DRAFT", ps: "2026-04-01", pe: "2026-06-30" },
    { no: "STL-2026-0012", cust: "中芯国际", ro: "RO-0002-01", title: "中芯国际2026Q3关务结算", total: 300000, invoiced: 0, received: 0, status: "DRAFT", ps: "2026-07-01", pe: "2026-09-30" },
    { no: "STL-2026-0013", cust: "华虹半导体", ro: "RO-0004-01", title: "华虹2026Q2代理服务结算", total: 180000, invoiced: 180000, received: 0, status: "CONFIRMED", ps: "2026-06-01", pe: "2026-07-31" },
    { no: "STL-2026-0014", cust: "华为", ro: "RO-0001-02", title: "华为2026Q2仓储服务结算", total: 130000, invoiced: 0, received: 0, status: "DRAFT", ps: "2026-04-01", pe: "2026-06-30" },
    { no: "STL-2026-0015", cust: "中芯国际", ro: "RO-0002-02", title: "中芯国际2026Q3仓储结算", total: 220000, invoiced: 0, received: 0, status: "DRAFT", ps: "2026-07-01", pe: "2026-09-30" },
  ];
  for (const stl of settlementDefs) {
    const roKey = Object.keys(bizOrders).find(k => k.includes(stl.ro.split("-")[1]!))!;
    const roId = bizOrders[roKey]?.revenueOrders[Object.keys(bizOrders[roKey]!.revenueOrders).find(rk => rk.includes(stl.ro.slice(-2))!)!];
    const r = await db.settlement.create({
      data: {
        settlementNo: stl.no,
        settlementType: "CUSTOMER_RECEIVABLE",
        customerId: customers[stl.cust] ?? null,
        revenueOrderId: roId ?? null,
        businessOrderId: bizOrders[Object.keys(bizOrders).find(k => k.includes(stl.ro.split("-")[1]!))!]?.id ?? null,
        title: stl.title,
        periodStart: d(stl.ps),
        periodEnd: d(stl.pe),
        totalAmount: money(stl.total),
        invoicedAmount: money(stl.invoiced),
        receivedAmount: money(stl.received),
        currency: "CNY",
        status: stl.status,
        createdBy: users["ar_accountant"],
      },
    });
    settlementIds.push(r.id);
  }
  console.log(`[settlements] ${settlementDefs.length} settlements`);

  // ═══════════════════════════════════════════════════════
  // 14. OUTPUT INVOICE APPLICATIONS (10)
  // ═══════════════════════════════════════════════════════
  const appDefs = [
    {
      appNo: "APP-2026-0001", settNo: "STL-2026-0001", cust: "华为",
      buyerName: "华为技术有限公司", buyerTaxNo: "91440300100000000X",
      buyerAddr: "深圳市龙岗区坂田华为基地", buyerPhone: "0755-28780888",
      buyerBank: "招商银行深圳分行", buyerBankAcct: "1234567890123456",
      category: "DIGITAL_SPECIAL", amtWoTax: 152542.37, taxAmt: 27457.63, amtWTax: 180000,
      status: "ISSUED", delMethod: "EMAIL", email: "wang.wm@huawei.com",
      items: [{ name: "关务服务费", qty: 5, price: 10000, taxRate: 6 }],
    },
    {
      appNo: "APP-2026-0002", settNo: "STL-2026-0004", cust: "中芯国际",
      buyerName: "中芯国际集成电路制造有限公司", buyerTaxNo: "91310000600000000Y",
      buyerAddr: "上海市浦东新区张江路18号", buyerPhone: "021-50801234",
      buyerBank: "工商银行上海张江支行", buyerBankAcct: "1001234567890123",
      category: "DIGITAL_SPECIAL", amtWoTax: 237288.14, taxAmt: 42711.86, amtWTax: 280000,
      status: "ISSUED", delMethod: "EMAIL", email: "li.fang@smic.com",
      items: [{ name: "关务服务费", qty: 8, price: 12000, taxRate: 6 }],
    },
    {
      appNo: "APP-2026-0003", settNo: "STL-2026-0002", cust: "华为",
      buyerName: "华为技术有限公司", buyerTaxNo: "91440300100000000X",
      buyerAddr: "深圳市龙岗区坂田华为基地", buyerPhone: "0755-28780888",
      buyerBank: "招商银行深圳分行", buyerBankAcct: "1234567890123456",
      category: "DIGITAL_SPECIAL", amtWoTax: 101694.92, taxAmt: 18305.08, amtWTax: 120000,
      status: "ISSUED", delMethod: "DOWNLOAD", email: null,
      items: [{ name: "仓储服务费", qty: 3, price: 10000, taxRate: 6 }],
    },
    {
      appNo: "APP-2026-0004", settNo: "STL-2026-0007", cust: "华虹半导体",
      buyerName: "华虹半导体有限公司", buyerTaxNo: "91310000800000000A",
      buyerAddr: "上海市浦东新区金桥出口加工区金豫路818号", buyerPhone: "021-50181234",
      buyerBank: "中国银行上海金桥支行", buyerBankAcct: "4538123456789012",
      category: "VAT_SPECIAL", amtWoTax: 330188.68, taxAmt: 19811.32, amtWTax: 350000,
      status: "PENDING_APPROVAL", delMethod: null, email: null,
      items: [
        { name: "关务服务费", qty: 3, price: 20000, taxRate: 6 },
        { name: "代理服务费", qty: 1, price: 25000, taxRate: 6 },
      ],
    },
    {
      appNo: "APP-2026-0005", settNo: "STL-2026-0003", cust: "华为",
      buyerName: "华为技术有限公司", buyerTaxNo: "91440300100000000X",
      buyerAddr: "深圳市龙岗区坂田华为基地", buyerPhone: "0755-28780888",
      buyerBank: "招商银行深圳分行", buyerBankAcct: "1234567890123456",
      category: "DIGITAL_SPECIAL", amtWoTax: 73394.50, taxAmt: 6605.50, amtWTax: 80000,
      status: "DRAFT", delMethod: null, email: null,
      items: [{ name: "运输服务费", qty: 10, price: 2000, taxRate: 9 }],
    },
    {
      appNo: "APP-2026-0006", settNo: "STL-2026-0005", cust: "中芯国际",
      buyerName: "中芯国际集成电路制造有限公司", buyerTaxNo: "91310000600000000Y",
      buyerAddr: "上海市浦东新区张江路18号", buyerPhone: "021-50801234",
      buyerBank: "工商银行上海张江支行", buyerBankAcct: "1001234567890123",
      category: "DIGITAL_SPECIAL", amtWoTax: 141509.43, taxAmt: 8490.57, amtWTax: 150000,
      status: "ISSUED", delMethod: "EMAIL", email: "li.fang@smic.com",
      items: [{ name: "仓储服务费", qty: 6, price: 8000, taxRate: 6 }],
    },
    {
      appNo: "APP-2026-0007", settNo: "STL-2026-0009", cust: "长鑫存储",
      buyerName: "长鑫存储技术有限公司", buyerTaxNo: "91340000MA00000001",
      buyerAddr: "安徽省合肥市经济技术开发区翠微路6号", buyerPhone: "0551-63631234",
      buyerBank: "建设银行合肥经开区支行", buyerBankAcct: "3401234567890123",
      category: "DIGITAL_SPECIAL", amtWoTax: 28301.89, taxAmt: 1698.11, amtWTax: 30000,
      status: "DRAFT", delMethod: null, email: null,
      items: [{ name: "咨询服务费", qty: 1, price: 30000, taxRate: 6 }],
    },
    {
      appNo: "APP-2026-0008", settNo: "STL-2026-0011", cust: "华为",
      buyerName: "华为技术有限公司", buyerTaxNo: "91440300100000000X",
      buyerAddr: "深圳市龙岗区坂田华为基地", buyerPhone: "0755-28780888",
      buyerBank: "招商银行深圳分行", buyerBankAcct: "1234567890123456",
      category: "DIGITAL_SPECIAL", amtWoTax: 94339.62, taxAmt: 5660.38, amtWTax: 100000,
      status: "APPROVED", delMethod: "EMAIL", email: "wang.wm@huawei.com",
      items: [
        { name: "关务服务费", qty: 3, price: 15000, taxRate: 6 },
        { name: "仓储服务费", qty: 2, price: 5000, taxRate: 6 },
      ],
    },
    {
      appNo: "APP-2026-0009", settNo: "STL-2026-0013", cust: "华虹半导体",
      buyerName: "华虹半导体有限公司", buyerTaxNo: "91310000800000000A",
      buyerAddr: "上海市浦东新区金桥出口加工区金豫路818号", buyerPhone: "021-50181234",
      buyerBank: "中国银行上海金桥支行", buyerBankAcct: "4538123456789012",
      category: "VAT_SPECIAL", amtWoTax: 159292.04, taxAmt: 20707.96, amtWTax: 180000,
      status: "REJECTED", delMethod: null, email: null,
      items: [{ name: "代理服务费", qty: 4, price: 25000, taxRate: 13 }],
    },
    {
      appNo: "APP-2026-0010", settNo: "STL-2026-0010", cust: "长江存储",
      buyerName: "长江存储科技有限责任公司", buyerTaxNo: "91420100000000002",
      buyerAddr: "武汉市东湖新技术开发区未来三路88号", buyerPhone: "027-81991234",
      buyerBank: "农业银行武汉光谷支行", buyerBankAcct: "1701234567890123",
      category: "DIGITAL_NORMAL", amtWoTax: 75471.70, taxAmt: 4528.30, amtWTax: 80000,
      status: "PENDING_APPROVAL", delMethod: null, email: null,
      items: [{ name: "物流方案服务费", qty: 1, price: 80000, taxRate: 6 }],
    },
  ];
  const appIds: Record<string, string> = {};
  for (const app of appDefs) {
    const settNoIdx = settlementDefs.findIndex(s => s.no === app.settNo);
    const settId = settlementIds[settNoIdx];
    const r = await db.outputInvoiceApplication.create({
      data: {
        applicationNo: app.appNo,
        sourceType: "SETTLEMENT",
        sourceId: settId ?? null,
        settlementId: settId ?? null,
        taxSubjectId: taxSubject.id,
        customerId: customers[app.cust]!,
        buyerName: app.buyerName,
        buyerTaxNo: app.buyerTaxNo,
        buyerAddress: app.buyerAddr,
        buyerPhone: app.buyerPhone,
        buyerBankName: app.buyerBank,
        buyerBankAccount: app.buyerBankAcct,
        invoiceCategory: app.category,
        amountWithoutTax: money(app.amtWoTax),
        taxAmount: money(app.taxAmt),
        amountWithTax: money(app.amtWTax),
        status: app.status,
        deliveryMethod: app.delMethod,
        recipientEmail: app.email,
        createdBy: users["operator"],
        items: {
          create: app.items.map((it, i) => ({
            itemName: it.name,
            quantity: money(it.qty),
            unitPrice: money(it.price),
            amount: money(it.qty * it.price),
            taxRate: money(it.taxRate),
            taxAmount: money(Math.round(it.qty * it.price * it.taxRate / 100 * 100) / 100),
            totalAmount: money(it.qty * it.price + Math.round(it.qty * it.price * it.taxRate / 100 * 100) / 100),
            sortOrder: i,
          })),
        },
      },
    });
    appIds[app.appNo] = r.id;
  }
  console.log(`[applications] ${appDefs.length} output invoice applications + items`);

  // ═══════════════════════════════════════════════════════
  // 15. OUTPUT INVOICES (4)
  // ═══════════════════════════════════════════════════════
  const invDefs = [
    {
      invNo: "24403200000000000001", invCode: "044032400101",
      appNo: "APP-2026-0001", category: "DIGITAL_SPECIAL",
      sellerName: "深圳半导体供应链有限公司", sellerTaxNo: "91440300MA5ABCD123",
      sellerAddr: "深圳市宝安区西乡街道宝安大道5018号", sellerPhone: "0755-29661234",
      sellerBank: "工商银行深圳宝安支行", sellerBankAcct: "4000123456789012",
      buyerName: "华为技术有限公司", buyerTaxNo: "91440300100000000X",
      buyerAddr: "深圳市龙岗区坂田华为基地", buyerPhone: "0755-28780888",
      buyerBank: "招商银行深圳分行", buyerBankAcct: "1234567890123456",
      amtWoTax: 152542.37, taxAmt: 27457.63, amtWTax: 180000,
      issueDate: "2026-03-31", bizDate: "2026-03-28", bizDesc: "2026Q1关务服务费",
      delStatus: "DELIVERED", verifyStatus: "VERIFIED",
      recordedBy: "张三", uploadFile: "24403200000000000001.pdf",
      verifiedBy: "系统自动查验", verifyTime: "2026-04-01T09:00:00Z", hdrMsg: null,
      pool: "OUTPUT", entry: "SYSTEM",
    },
    {
      invNo: "24403200000000000002", invCode: "044032400102",
      appNo: "APP-2026-0002", category: "DIGITAL_SPECIAL",
      sellerName: "深圳半导体供应链有限公司", sellerTaxNo: "91440300MA5ABCD123",
      sellerAddr: "深圳市宝安区西乡街道宝安大道5018号", sellerPhone: "0755-29661234",
      sellerBank: "工商银行深圳宝安支行", sellerBankAcct: "4000123456789012",
      buyerName: "中芯国际集成电路制造有限公司", buyerTaxNo: "91310000600000000Y",
      buyerAddr: "上海市浦东新区张江路18号", buyerPhone: "021-50801234",
      buyerBank: "工商银行上海张江支行", buyerBankAcct: "1001234567890123",
      amtWoTax: 237288.14, taxAmt: 42711.86, amtWTax: 280000,
      issueDate: "2026-06-30", bizDate: "2026-06-25", bizDesc: "2026Q2关务及仓储服务费",
      delStatus: "DELIVERED", verifyStatus: "PENDING",
      recordedBy: "张三", uploadFile: "24403200000000000002.pdf",
      verifiedBy: null, verifyTime: null, hdrMsg: null,
      pool: "OUTPUT", entry: "SYSTEM",
    },
    {
      invNo: "24403200000000000003", invCode: "044032400103",
      appNo: "APP-2026-0003", category: "DIGITAL_SPECIAL",
      sellerName: "深圳半导体供应链有限公司", sellerTaxNo: "91440300MA5ABCD123",
      sellerAddr: "深圳市宝安区西乡街道宝安大道5018号", sellerPhone: "0755-29661234",
      sellerBank: "工商银行深圳宝安支行", sellerBankAcct: "4000123456789012",
      buyerName: "华为技术有限公司", buyerTaxNo: "91440300100000000X",
      buyerAddr: "深圳市龙岗区坂田华为基地", buyerPhone: "0755-28780888",
      buyerBank: "招商银行深圳分行", buyerBankAcct: "1234567890123456",
      amtWoTax: 101694.92, taxAmt: 18305.08, amtWTax: 120000,
      issueDate: "2026-07-05", bizDate: "2026-07-01", bizDesc: "2026Q3仓储服务费",
      delStatus: "PENDING", verifyStatus: "PENDING",
      recordedBy: "李四", uploadFile: "平安发票10221016800206642607.pdf",
      verifiedBy: null, verifyTime: null, hdrMsg: null,
      pool: "OUTPUT", entry: "SYSTEM",
    },
    {
      invNo: "24403200000000000004", invCode: "044032400104",
      appNo: "APP-2026-0006", category: "DIGITAL_SPECIAL",
      sellerName: "深圳半导体供应链有限公司", sellerTaxNo: "91440300MA5ABCD123",
      sellerAddr: "深圳市宝安区西乡街道宝安大道5018号", sellerPhone: "0755-29661234",
      sellerBank: "工商银行深圳宝安支行", sellerBankAcct: "4000123456789012",
      buyerName: "中芯国际集成电路制造有限公司", buyerTaxNo: "91310000600000000Y",
      buyerAddr: "上海市浦东新区张江路18号", buyerPhone: "021-50801234",
      buyerBank: "工商银行上海张江支行", buyerBankAcct: "1001234567890123",
      amtWoTax: 141509.43, taxAmt: 8490.57, amtWTax: 150000,
      issueDate: "2026-07-10", bizDate: "2026-07-05", bizDesc: "2026Q2仓储服务费",
      delStatus: "PENDING", verifyStatus: "PENDING",
      recordedBy: "李四", uploadFile: null,
      verifiedBy: null, verifyTime: null, hdrMsg: null,
      pool: "OUTPUT", entry: "SYSTEM",
    },
  ];
  const outputInvIds: string[] = [];
  for (const inv of invDefs) {
    const app = appDefs.find(a => a.appNo === inv.appNo)!;
    const r = await db.outputInvoice.create({
      data: {
        invoiceNo: inv.invNo,
        invoiceCode: inv.invCode,
        invoiceCategory: inv.category,
        applicationId: appIds[inv.appNo]!,
        taxSubjectId: taxSubject.id,
        sellerName: inv.sellerName,
        sellerTaxNo: inv.sellerTaxNo,
        sellerAddress: inv.sellerAddr,
        sellerPhone: inv.sellerPhone,
        sellerBankName: inv.sellerBank,
        sellerBankAccount: inv.sellerBankAcct,
        buyerName: inv.buyerName,
        buyerTaxNo: inv.buyerTaxNo,
        buyerAddress: inv.buyerAddr,
        buyerPhone: inv.buyerPhone,
        buyerBankName: inv.buyerBank,
        buyerBankAccount: inv.buyerBankAcct,
        issueDate: d(inv.issueDate),
        businessDate: d(inv.bizDate),
        businessDescription: inv.bizDesc,
        amountWithoutTax: money(inv.amtWoTax),
        taxAmount: money(inv.taxAmt),
        amountWithTax: money(inv.amtWTax),
        deliveryStatus: inv.delStatus,
        verifyStatus: inv.verifyStatus,
        invoicePool: inv.pool,
        entryMethod: inv.entry,
        recordedBy: inv.recordedBy,
        uploadFilename: inv.uploadFile,
        verifiedBy: inv.verifiedBy,
        verifyTime: inv.verifyTime ? d(inv.verifyTime) : null,
        headerValidationMessage: inv.hdrMsg,
        items: {
          create: app.items.map((it, i) => ({
            itemName: it.name,
            quantity: money(it.qty),
            unitPrice: money(it.price),
            amount: money(it.qty * it.price),
            taxRate: money(it.taxRate),
            taxAmount: money(Math.round(it.qty * it.price * it.taxRate / 100 * 100) / 100),
            totalAmount: money(it.qty * it.price + Math.round(it.qty * it.price * it.taxRate / 100 * 100) / 100),
            sortOrder: i,
          })),
        },
      },
    });
    outputInvIds.push(r.id);
  }
  console.log(`[output_invoices] ${invDefs.length} output invoices + items`);

  // ═══════════════════════════════════════════════════════
  // 16. INPUT INVOICES (5)
  // ═══════════════════════════════════════════════════════
  const inputInvDefs = [
    {
      invNo: "24403200000000000101", invCode: "044032400201", invCategory: "VAT_SPECIAL",
      sellerName: "顺丰速运有限公司", sellerTaxNo: "91440300200000000A",
      sellerAddr: "深圳市南山区科技园南路1号顺丰总部大厦", sellerPhone: "0755-36370000",
      sellerBank: "招商银行深圳南山支行", sellerBankAcct: "7559123456789012",
      buyerName: "深圳半导体供应链有限公司", buyerTaxNo: "91440300MA5ABCD123",
      buyerAddr: "深圳市宝安区西乡街道宝安大道5018号", buyerPhone: "0755-29661234",
      buyerBank: "工商银行深圳宝安支行", buyerBankAcct: "4000123456789012",
      supplier: "顺丰", biz: "SO-2026-0001", cc: "CC-TRANSPORT",
      amtWoTax: 7339.45, taxAmt: 660.55, amtWTax: 8000, taxRate: 9,
      issueDate: "2026-07-05", bizDate: "2026-07-01",
      bizDesc: "2026Q3深圳-上海芯片运输服务", travelProvider: null,
      status: "VERIFIED", verify: "VERIFIED", deduct: "DEDUCTED",
      entry: "MANUAL", recordedBy: "张三", uploadFile: "INP-2026-001.pdf",
      verifiedBy: "系统自动查验", verifyTime: "2026-07-05T10:30:00Z", hdrMsg: null,
      deductSel: "SELECTED", nonDeductRsn: null, voucherDt: "2026-07-06", voucherNo: "PZ-2026-07001", deductAmt: 660.55,
      pool: "INPUT", items: [{ name: "国内货物运输服务", qty: 1, price: 7339.45, taxRate: 9 }],
    },
    {
      invNo: "24403200000000000102", invCode: "044032400202", invCategory: "VAT_SPECIAL",
      sellerName: "京东物流集团", sellerTaxNo: "91110000300000000B",
      sellerAddr: "北京市大兴区亦庄经济开发区京东大厦", sellerPhone: "010-89118888",
      sellerBank: "中国银行北京亦庄支行", sellerBankAcct: "3217567890123456",
      buyerName: "深圳半导体供应链有限公司", buyerTaxNo: "91440300MA5ABCD123",
      buyerAddr: "深圳市宝安区西乡街道宝安大道5018号", buyerPhone: "0755-29661234",
      buyerBank: "工商银行深圳宝安支行", buyerBankAcct: "4000123456789012",
      supplier: "京东物流", biz: "SO-2026-0002", cc: "CC-WAREHOUSE",
      amtWoTax: 4716.98, taxAmt: 283.02, amtWTax: 5000, taxRate: 6,
      issueDate: "2026-07-06", bizDate: "2026-07-02",
      bizDesc: "2026Q3半导体物料仓储服务", travelProvider: null,
      status: "PENDING_VERIFY", verify: "PENDING", deduct: "PENDING",
      entry: "OCR", recordedBy: "李四", uploadFile: "INP-2026-002.pdf",
      verifiedBy: null, verifyTime: null, hdrMsg: null,
      deductSel: "UNSELECTED", nonDeductRsn: null, voucherDt: null, voucherNo: null, deductAmt: null,
      pool: "INPUT", items: [{ name: "仓储服务费", qty: 1, price: 4716.98, taxRate: 6 }],
    },
    {
      invNo: "24403200000000000103", invCode: null, invCategory: "DIGITAL_SPECIAL",
      sellerName: "中外运报关有限公司", sellerTaxNo: "91310000400000000C",
      sellerAddr: "上海市浦东新区外高桥保税区富特路500号", sellerPhone: "021-58660000",
      sellerBank: "建设银行上海外高桥支行", sellerBankAcct: "3100123456789012",
      buyerName: "深圳半导体供应链有限公司", buyerTaxNo: "91440300MA5ABCD123",
      buyerAddr: "深圳市宝安区西乡街道宝安大道5018号", buyerPhone: "0755-29661234",
      buyerBank: "工商银行深圳宝安支行", buyerBankAcct: "4000123456789012",
      supplier: "中外运报关", biz: "SO-2026-0004", cc: "CC-CUSTOMS",
      amtWoTax: 11320.75, taxAmt: 679.25, amtWTax: 12000, taxRate: 6,
      issueDate: "2026-07-07", bizDate: "2026-07-03",
      bizDesc: "设备进口关务申报服务", travelProvider: null,
      status: "VERIFY_FAILED", verify: "VERIFY_FAILED", deduct: "PENDING",
      entry: "MANUAL", recordedBy: "王五", uploadFile: "INP-2026-003.pdf", fromTax: true,
      verifiedBy: "系统自动查验", verifyTime: "2026-07-07T09:15:00Z", hdrMsg: "发票抬头与本公司配置的抬头不一致，请核实",
      deductSel: "UNSELECTED", nonDeductRsn: "抬头错误待修正", voucherDt: null, voucherNo: null, deductAmt: null,
      pool: "INPUT", items: [{ name: "关务服务费", qty: 1, price: 11320.75, taxRate: 6 }],
    },
    {
      invNo: "24403200000000000104", invCode: "044032400204", invCategory: "VAT_SPECIAL",
      sellerName: "中国外运股份有限公司", sellerTaxNo: "91110000500000000D",
      sellerAddr: "北京市朝阳区安定路5号院外运大厦", sellerPhone: "010-62295555",
      sellerBank: "中国银行北京朝阳支行", sellerBankAcct: "4559123456789012",
      buyerName: "深圳半导体供应链有限公司", buyerTaxNo: "91440300MA5ABCD123",
      buyerAddr: "深圳市宝安区西乡街道宝安大道5018号", buyerPhone: "0755-29661234",
      buyerBank: "工商银行深圳宝安支行", buyerBankAcct: "4000123456789012",
      supplier: "中国外运", biz: "SO-2026-0002", cc: "CC-TRANSPORT",
      amtWoTax: 18348.62, taxAmt: 1651.38, amtWTax: 20000, taxRate: 9,
      issueDate: "2026-06-15", bizDate: "2026-06-10",
      bizDesc: "2026Q2国际物流运输与国内配送", travelProvider: null,
      status: "VERIFIED", verify: "VERIFIED", deduct: "DEDUCTED",
      entry: "MANUAL", recordedBy: "张三", uploadFile: "INP-2026-004.pdf",
      verifiedBy: "系统自动查验", verifyTime: "2026-06-16T14:00:00Z", hdrMsg: null,
      deductSel: "SELECTED", nonDeductRsn: null, voucherDt: "2026-06-20", voucherNo: "PZ-2026-06015", deductAmt: 1651.38,
      pool: "INPUT",
      items: [
        { name: "国际货物运输代理服务", qty: 1, price: 9174.31, taxRate: 0 },
        { name: "国内段配送", qty: 1, price: 9174.31, taxRate: 9 },
      ],
    },
    {
      invNo: "24403200000000000105", invCode: "044032400205", invCategory: "VAT_SPECIAL",
      sellerName: "深圳市报关协会服务中心", sellerTaxNo: "91440300600000000E",
      sellerAddr: "深圳市福田区福华三路168号国际商会中心", sellerPhone: "0755-82345678",
      sellerBank: "招商银行深圳福田支行", sellerBankAcct: "7559123456789999",
      buyerName: "深圳半导体供应链有限公司", buyerTaxNo: "91440300MA5ABCD123",
      buyerAddr: "深圳市宝安区西乡街道宝安大道5018号", buyerPhone: "0755-29661234",
      buyerBank: "工商银行深圳宝安支行", buyerBankAcct: "4000123456789012",
      supplier: "报关协会", biz: "SO-2026-0001", cc: "CC-AGENCY",
      amtWoTax: 28301.89, taxAmt: 1698.11, amtWTax: 30000, taxRate: 6,
      issueDate: "2026-05-20", bizDate: "2026-05-15",
      bizDesc: "2026年度报关代理服务费", travelProvider: "深圳报关协会商旅服务部",
      status: "VERIFIED", verify: "VERIFIED", deduct: "PENDING",
      entry: "MANUAL", recordedBy: "李四", uploadFile: "INP-2026-005.pdf", isAdv: true, costType: "AGENCY",
      verifiedBy: "系统自动查验", verifyTime: "2026-05-21T11:00:00Z", hdrMsg: null,
      deductSel: "UNSELECTED", nonDeductRsn: "待业务确认后认证", voucherDt: null, voucherNo: null, deductAmt: null,
      pool: "INPUT", items: [{ name: "代理服务费", qty: 1, price: 28301.89, taxRate: 6 }],
    },
  ];
  for (const iinv of inputInvDefs) {
    await db.inputInvoice.create({
      data: {
        invoiceNo: iinv.invNo,
        invoiceCode: (iinv as Record<string,unknown>).invCode as string ?? null,
        invoiceCategory: iinv.invCategory,
        sellerName: iinv.sellerName,
        sellerTaxNo: iinv.sellerTaxNo,
        sellerAddress: iinv.sellerAddr,
        sellerPhone: iinv.sellerPhone,
        sellerBankName: iinv.sellerBank,
        sellerBankAccount: iinv.sellerBankAcct,
        buyerName: iinv.buyerName,
        buyerTaxNo: iinv.buyerTaxNo,
        buyerAddress: iinv.buyerAddr,
        buyerPhone: iinv.buyerPhone,
        buyerBankName: iinv.buyerBank,
        buyerBankAccount: iinv.buyerBankAcct,
        supplierId: suppliers[iinv.supplier] ?? null,
        businessOrderId: bizOrders[iinv.biz]?.id ?? null,
        costCenterId: costCenters[iinv.cc] ?? null,
        issueDate: d(iinv.issueDate),
        businessDate: d(iinv.bizDate),
        businessDescription: iinv.bizDesc,
        travelServiceProvider: iinv.travelProvider,
        amountWithoutTax: money(iinv.amtWoTax),
        taxAmount: money(iinv.taxAmt),
        amountWithTax: money(iinv.amtWTax),
        taxRate: money(iinv.taxRate),
        status: iinv.status,
        verifyStatus: iinv.verify,
        deductStatus: iinv.deduct,
        entryMethod: iinv.entry,
        recordedBy: iinv.recordedBy,
        uploadFilename: iinv.uploadFile,
        invoicePool: iinv.pool,
        isFromTaxAuthority: iinv["fromTax"] ?? false,
        isAdvanceCost: iinv["isAdv"] ?? false,
        costType: iinv["costType"] ?? null,
        verifiedBy: iinv.verifiedBy,
        verifyTime: iinv.verifyTime ? d(iinv.verifyTime) : null,
        headerValidationMessage: iinv.hdrMsg,
        deductSelectionStatus: iinv.deductSel,
        nonDeductReason: iinv.nonDeductRsn,
        voucherDate: iinv.voucherDt ? d(iinv.voucherDt) : null,
        voucherNo: iinv.voucherNo,
        deductibleAmount: iinv.deductAmt ? money(iinv.deductAmt) : null,
        items: {
          create: iinv.items.map((it, i) => ({
            itemName: it.name,
            quantity: money(it.qty),
            unitPrice: money(it.price),
            amount: money(it.qty * it.price),
            taxRate: money(it.taxRate),
            taxAmount: money(Math.round(it.qty * it.price * it.taxRate / 100 * 100) / 100),
            totalAmount: money(it.qty * it.price + Math.round(it.qty * it.price * it.taxRate / 100 * 100) / 100),
            sortOrder: i,
          })),
        },
      },
    });
  }
  console.log(`[input_invoices] ${inputInvDefs.length} input invoices + items`);

  // ═══════════════════════════════════════════════════════
  // 17. RED FLUSH APPLICATIONS (2)
  // ═══════════════════════════════════════════════════════
  if (outputInvIds.length >= 2) {
    await db.redFlushApplication.create({
      data: {
        applicationNo: "RF-2026-0001",
        originalInvoiceId: outputInvIds[0]!,
        redFlushType: "FULL",
        redFlushReason: "AMOUNT_ERROR",
        reasonDescription: "客户要求全额红冲，调整结算金额",
        amountWithoutTax: money(152542.37),
        taxAmount: money(27457.63),
        amountWithTax: money(180000),
        needsReissue: true,
        status: "PENDING_APPROVAL",
      },
    });
    await db.redFlushApplication.create({
      data: {
        applicationNo: "RF-2026-0002",
        originalInvoiceId: outputInvIds[1]!,
        redFlushType: "PARTIAL",
        redFlushReason: "GOODS_RETURN",
        reasonDescription: "部分设备退货，冲红对应报关费",
        amountWithoutTax: money(50000),
        taxAmount: money(3000),
        amountWithTax: money(53000),
        needsReissue: false,
        status: "DRAFT",
      },
    });
    console.log("[red_flush] 2 red flush applications");
  }

  // ═══════════════════════════════════════════════════════
  // 18. VOID APPLICATIONS (2)
  // ═══════════════════════════════════════════════════════
  if (outputInvIds.length >= 3) {
    await db.voidApplication.create({
      data: {
        applicationNo: "VD-2026-0001",
        invoiceId: outputInvIds[2]!,
        voidCategory: "APPLICATION_CANCEL",
        voidReason: "DUPLICATE_ISSUE",
        reasonDetail: "发票重复开具，需作废",
        status: "PENDING_APPROVAL",
      },
    });
    await db.voidApplication.create({
      data: {
        applicationNo: "VD-2026-0002",
        invoiceId: outputInvIds[0]!,
        voidCategory: "LEGACY_INVOICE_VOID",
        voidReason: "OTHER",
        reasonDetail: "发票已红冲，原票需作废",
        status: "DRAFT",
      },
    });
    console.log("[void] 2 void applications");
  }

  // ═══════════════════════════════════════════════════════
  // 19. RISK RESULTS (3)
  // ═══════════════════════════════════════════════════════
  await db.riskResult.create({
    data: {
      ruleCode: "RISK-001", ruleName: "重复开票检查",
      riskLevel: "LOW", entityType: "output_invoice",
      entityId: outputInvIds[0] ?? "none",
      description: "近30天内无重复开票记录",
      suggestion: "定期复查",
      isResolved: true,
    },
  });
  await db.riskResult.create({
    data: {
      ruleCode: "RISK-002", ruleName: "代垫金额超限检查",
      riskLevel: "MEDIUM", entityType: "advance_payment",
      entityId: advancePayments["P-26070177"] ?? "none",
      description: "中芯国际Q2单笔代垫超20万元，需业务经理确认",
      suggestion: "核实业务合同代垫上限条款",
      isResolved: false,
    },
  });
  await db.riskResult.create({
    data: {
      ruleCode: "RISK-003", ruleName: "进项发票抬头校验",
      riskLevel: "HIGH", entityType: "input_invoice",
      entityId: "INP-2026-003",
      description: "中外运报关进项发票购买方税号与公司税号不一致",
      suggestion: "联系供应商重新开具正确抬头发票",
      isResolved: false,
    },
  });
  console.log("[risk] 3 risk results");

  // ═══════════════════════════════════════════════════════
  // 20. WORKFLOW DEFINITIONS (4)
  // ═══════════════════════════════════════════════════════
  const wfDefs = [
    {
      entityType: "APPLICATION",
      name: "开票申请审批",
      steps: JSON.stringify([
        { step: 0, role: "business_manager", label: "业务经理审批" },
        { step: 1, role: "finance_manager", label: "财务主管审批" },
        { step: 2, role: "admin", label: "总经理审批" },
      ]),
    },
    {
      entityType: "RED_FLUSH",
      name: "红冲申请审批",
      steps: JSON.stringify([
        { step: 0, role: "finance_manager", label: "财务主管审批" },
        { step: 1, role: "admin", label: "总经理审批" },
      ]),
    },
    {
      entityType: "VOID",
      name: "作废申请审批",
      steps: JSON.stringify([
        { step: 0, role: "finance_manager", label: "财务主管审批" },
      ]),
    },
    {
      entityType: "ADVANCE",
      name: "代垫确认审批",
      steps: JSON.stringify([
        { step: 0, role: "business_manager", label: "业务经理审批" },
        { step: 1, role: "finance_manager", label: "财务主管审批" },
      ]),
    },
  ];
  for (const wf of wfDefs) {
    await db.workflowDefinition.create({ data: wf });
  }
  console.log(`[workflow_defs] ${wfDefs.length} workflow definitions`);

  // ═══════════════════════════════════════════════════════
  // 21. WORKFLOW INSTANCES (2)
  // ═══════════════════════════════════════════════════════
  // Instance 1: APP-2026-0004 待审批
  const wf1Steps = [
    { step: 0, role: "business_manager", label: "业务经理", status: "APPROVED", assigneeName: "业务经理", comment: "同意，客户资信良好", timestamp: new Date("2026-06-01").toISOString() },
    { step: 1, role: "finance_manager", label: "财务主管", status: "PENDING", assigneeName: null, comment: null, timestamp: null },
    { step: 2, role: "admin", label: "总经理", status: "WAITING", assigneeName: null, comment: null, timestamp: null },
  ];
  await db.workflowInstance.create({
    data: {
      entityType: "APPLICATION",
      entityId: appIds["APP-2026-0004"] ?? "none",
      entityTitle: "华虹Q1设备进口关务结算开票申请 ¥350,000",
      totalSteps: 3,
      currentStep: 1,
      stepsData: JSON.stringify(wf1Steps),
      records: {
        create: [{ stepOrder: 0, approverId: users["business_manager"]!, approverName: "业务经理", action: "APPROVED", comment: "同意，客户资信良好" }],
      },
    },
  });

  // Instance 2: RF-2026-0001 待审批
  const wf2Steps = [
    { step: 0, role: "finance_manager", label: "财务主管", status: "PENDING", assigneeName: null, comment: null, timestamp: null },
    { step: 1, role: "admin", label: "总经理", status: "WAITING", assigneeName: null, comment: null, timestamp: null },
  ];
  await db.workflowInstance.create({
    data: {
      entityType: "RED_FLUSH",
      entityId: "RF-2026-0001",
      entityTitle: "华为Q1关务发票红冲申请 ¥180,000",
      totalSteps: 2,
      currentStep: 0,
      stepsData: JSON.stringify(wf2Steps),
    },
  });
  console.log("[workflow_instances] 2 workflow instances");

  console.log("\n=== Seed 完成 ===");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
