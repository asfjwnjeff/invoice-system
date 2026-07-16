import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { generateInvoiceNo, generateInvoiceCode } from "@/lib/invoice-number";

// MOCK: Pull newly issued invoices from tax bureau into the system
// Tax bureau has issued invoices → sync them to our system
export async function POST() {
  const session = await auth(); if (!session) return error("未登录", 401);

  // Get an existing tax subject and customer for mock data
  const taxSubject = await db.taxSubject.findFirst({ where: { isDefault: true } });
  const customer = await db.customer.findFirst();
  const now = new Date();

  // Mock: simulate receiving 1-2 new invoices from tax bureau
  const count = Math.floor(Math.random() * 2) + 1;
  const created: string[] = [];

  for (let i = 0; i < count; i++) {
    const invoiceNo = generateInvoiceNo();
    const invoiceCode = generateInvoiceCode();
    const amount = Math.floor(Math.random() * 500000) + 10000;
    const taxRate = [6, 9, 13][Math.floor(Math.random() * 3)]!;
    const taxAmount = Math.round(amount * taxRate / 100);
    const issueDate = new Date(now.getTime() - Math.floor(Math.random() * 7 * 86400000));

    const inv = await db.outputInvoice.create({
      data: {
        invoiceNo,
        invoiceCode,
        invoiceCategory: "DIGITAL_SPECIAL",
        direction: "OUTPUT",
        blueRedFlag: "BLUE",
        taxSubjectId: taxSubject?.id || "",
        sellerName: taxSubject?.name || "深圳半导体供应链有限公司",
        sellerTaxNo: taxSubject?.taxNo || "91440300MA5ABCD123",
        buyerName: customer?.name || "华为技术有限公司",
        buyerTaxNo: customer?.taxNo || "91440300100000000X",
        buyerAddress: customer?.address || "",
        buyerPhone: customer?.phone || "",
        issueDate,
        amountWithoutTax: amount,
        taxAmount,
        amountWithTax: amount + taxAmount,
        currency: "CNY",
        verifyStatus: "PENDING",
        deliveryStatus: "PENDING",
        isFromTaxAuthority: true,
        usageStatus: "UNUSED",
        pushStatus: "PENDING",
        pushToCBMSStatus: "PENDING",
        emailDeliveryStatus: "PENDING",
        entryMethod: "SYSTEM",
        recordedBy: session.user.name || session.user.id,
      },
    });
    // Create at least one invoice item
    await db.outputInvoiceItem.create({
      data: {
        invoiceId: inv.id,
        itemName: "半导体供应链服务",
        quantity: 1,
        unitPrice: amount,
        amount,
        taxRate,
        taxAmount,
        totalAmount: amount + taxAmount,
        sortOrder: 0,
      },
    });
    created.push(invoiceNo);
  }

  try {
    await db.operationLog.create({
      data: {
        userId: session.user.id,
        action: "SYNC_FROM_TAX",
        entityType: "output_invoice",
        newValue: JSON.stringify({ count, invoices: created, syncedAt: now.toISOString() }),
      },
    });
  } catch { /* log failure should not block the API */ }

  return success({
    count,
    invoices: created,
    syncedAt: now.toISOString(),
    message: `已从税局拉取 ${count} 张新发票`,
  });
}
