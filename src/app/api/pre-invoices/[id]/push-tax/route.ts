import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

// MOCK: Push pre-invoice to tax bureau. Replace with real 链票 API.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const preInvoice = await db.preInvoice.findUnique({
    where: { id },
    include: { items: true, application: true, taxSubject: true },
  });
  if (!preInvoice) return error("预制发票不存在", 404);
  if (preInvoice.reviewStatus !== "APPROVED") return error("仅已审批的预制发票可推送税局");

  // Mock: Simulate tax bureau response
  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const invoiceCode = `04400${String(Math.floor(Math.random() * 9999999)).padStart(8, "0")}`;
  const taxSerialNo = `TAX-${randomUUID().slice(0, 8).toUpperCase()}`;
  const issueDate = new Date();

  const taxResponse = {
    invoiceNo,
    invoiceCode,
    taxSerialNo,
    issueDate: issueDate.toISOString(),
    status: "SUCCESS",
    message: "开票成功",
  };

  // Create OutputInvoice from pre-invoice data
  const outputInvoice = await db.outputInvoice.create({
    data: {
      invoiceNo,
      invoiceCode,
      invoiceCategory: preInvoice.invoiceCategory,
      direction: "OUTPUT",
      blueRedFlag: "BLUE",
      applicationId: preInvoice.applicationId,
      taxSubjectId: preInvoice.taxSubjectId,
      sellerName: preInvoice.sellerName || "",
      sellerTaxNo: preInvoice.sellerTaxNo || "",
      buyerName: preInvoice.buyerName,
      buyerTaxNo: preInvoice.buyerTaxNo || "",
      buyerAddress: preInvoice.buyerAddress || "",
      buyerPhone: preInvoice.buyerPhone || "",
      buyerBankName: preInvoice.buyerBankName || "",
      buyerBankAccount: preInvoice.buyerBankAccount || "",
      issueDate,
      amountWithoutTax: preInvoice.amountWithoutTax,
      taxAmount: preInvoice.taxAmount,
      amountWithTax: preInvoice.amountWithTax,
      remark: preInvoice.remark,
      verifyStatus: "VERIFIED",
      deliveryStatus: "PENDING",
      isFromTaxAuthority: true,
      usageStatus: "UNUSED",
      pushStatus: "PENDING",
      items: {
        create: preInvoice.items.map((item, idx) => ({
          itemName: item.itemName,
          taxClassificationCode: item.taxClassificationCode,
          invoiceItemId: item.invoiceItemId,
          spec: item.spec,
          unit: item.unit,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
          taxRate: item.taxRate,
          taxAmount: item.taxAmount,
          totalAmount: item.totalAmount,
          feeType: item.feeType,
          sortOrder: idx,
        })),
      },
    },
  });

  // Update pre-invoice with push status and link to output invoice
  await db.preInvoice.update({
    where: { id },
    data: {
      taxPushStatus: "PUSHED",
      taxPushAt: new Date(),
      taxResponseData: JSON.stringify(taxResponse),
      reviewStatus: "APPROVED",
      outputInvoiceId: outputInvoice.id,
    },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "PUSH_TAX",
      entityType: "pre_invoice",
      entityId: id,
      newValue: JSON.stringify({ invoiceNo, invoiceCode, taxSerialNo }),
    },
  });

  return success({
    invoiceNo,
    invoiceCode,
    taxSerialNo,
    invoiceId: outputInvoice.id,
    issueDate: issueDate.toISOString(),
    message: "已成功推送税局并开具发票",
  });
}
