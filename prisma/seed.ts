import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create the default organization first
  const org = await db.organization.create({
    data: { name: "深圳半导体供应链有限公司", shortName: "深圳半导体", code: "SZ-SEMI-001", description: "深圳公司主体" },
  });
  console.log(`Created organization: ${org.name}`);

  // Users (11 roles)
  const users = [
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

  for (const u of users) {
    await db.user.create({ data: { ...u, organizationId: org.id } });
  }
  console.log(`Created ${users.length} users`);

  // Tax Subject
  await db.taxSubject.create({
    data: { name: "深圳半导体供应链有限公司", taxNo: "91440300XXXXXXXXXX", organizationId: org.id, isDefault: true },
  });

  // Customers
  const customers = [
    { name: "华为技术有限公司", taxNo: "91440300100000000X", contactPerson: "王经理", contactPhone: "13800138001", contactEmail: "wang@huawei.com" },
    { name: "中芯国际集成电路制造有限公司", taxNo: "91310000600000000Y", contactPerson: "李经理", contactPhone: "13800138002", contactEmail: "li@smic.com" },
    { name: "长鑫存储技术有限公司", taxNo: "91340000700000000Z", contactPerson: "张经理", contactPhone: "13800138003", contactEmail: "zhang@cxmt.com" },
  ];
  for (const c of customers) {
    await db.customer.create({ data: { ...c, organizationId: org.id } });
  }
  console.log(`Created ${customers.length} customers`);

  // Suppliers
  const suppliers = [
    { name: "顺丰速运有限公司", taxNo: "91440300200000000A", supplierType: "transport" },
    { name: "京东物流集团", taxNo: "91110000300000000B", supplierType: "warehouse" },
    { name: "中外运报关有限公司", taxNo: "91310000400000000C", supplierType: "customs" },
  ];
  for (const s of suppliers) {
    await db.supplier.create({ data: { ...s, organizationId: org.id } });
  }
  console.log(`Created ${suppliers.length} suppliers`);

  // Invoice Items
  const items = [
    { name: "关务服务费", taxCode: "304030101", unit: "次", feeType: "CUSTOMS_SERVICE" as const },
    { name: "仓储服务费", taxCode: "304030201", unit: "月", feeType: "WAREHOUSE_SERVICE" as const },
    { name: "运输服务费", taxCode: "301010201", unit: "票", feeType: "TRANSPORT_SERVICE" as const },
    { name: "代理服务费", taxCode: "304030301", unit: "次", feeType: "AGENCY_SERVICE" as const },
  ];
  for (const item of items) {
    await db.invoiceItem.create({ data: item });
  }
  console.log(`Created ${items.length} invoice items`);

  // Tax Codes
  const taxCodes = [
    { code: "304030101", name: "关务服务", description: "报关、报检、关务咨询服务" },
    { code: "304030201", name: "仓储服务", description: "货物仓储、库存管理服务" },
    { code: "301010201", name: "国内货物运输服务", description: "国内公路/铁路/航空货物运输" },
    { code: "304030301", name: "代理服务", description: "供应链管理、进出口代理服务" },
  ];
  for (const tc of taxCodes) await db.taxCode.create({ data: tc });
  console.log(`Created ${taxCodes.length} tax codes`);

  // Cost Centers
  for (const cc of [
    { name: "关务部", code: "CC-CUSTOMS" },
    { name: "仓储部", code: "CC-WAREHOUSE" },
    { name: "运输部", code: "CC-TRANSPORT" },
  ]) {
    await db.costCenter.create({ data: { ...cc, organizationId: org.id } });
  }
  console.log("Created 3 cost centers");

  // Sample Business Order + Revenue Order
  const firstCustomer = await db.customer.findFirst();
  if (firstCustomer) {
    const order = await db.businessOrder.create({
      data: {
        orderNo: "SO-2026-0001",
        orderType: "COMPREHENSIVE",
        title: "华为技术有限公司2026年Q1综合供应链服务",
        customerId: firstCustomer.id,
        organizationId: org.id,
      },
    });
    await db.revenueOrder.create({
      data: {
        orderNo: "RO-2026-0001",
        title: "华为Q1综合供应链服务",
        businessOrderId: order.id,
        customerId: firstCustomer.id,
        totalRevenueAmount: 150000,
        availableAmount: 150000,
      },
    });
    console.log("Created sample business order + revenue order");
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
