import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { generatePreInvoiceNo } from "@/lib/invoice-number";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { preInvoiceNo: { contains: search } },
      { buyerName: { contains: search } },
    ];
  }
  if (status) {
    where.reviewStatus = status;
  }

  const items = await db.preInvoice.findMany({
    where,
    include: { items: true, customer: true },
    orderBy: { createdAt: "desc" },
  });

  return success({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();
  const { applicationId, invoiceCategory, taxSubjectId, customerId, buyerName, buyerTaxNo, buyerAddress, buyerPhone, buyerBankName, buyerBankAccount, sellerName, sellerTaxNo, amountWithoutTax, taxAmount, amountWithTax, remark, items } = body;

  if (!customerId || !buyerName || !invoiceCategory) {
    return error("购买方、发票类型为必填项");
  }

  const preInvoiceNo = generatePreInvoiceNo();

  const preInvoice = await db.preInvoice.create({
    data: {
      preInvoiceNo,
      sourceType: applicationId ? "APPLICATION" : "MANUAL",
      applicationId: applicationId || null,
      taxSubjectId: taxSubjectId || "default",
      customerId,
      buyerName,
      buyerTaxNo: buyerTaxNo || null,
      buyerAddress: buyerAddress || null,
      buyerPhone: buyerPhone || null,
      buyerBankName: buyerBankName || null,
      buyerBankAccount: buyerBankAccount || null,
      sellerName: sellerName || "",
      sellerTaxNo: sellerTaxNo || null,
      invoiceCategory: invoiceCategory || "DIGITAL_SPECIAL",
      amountWithoutTax: amountWithoutTax || 0,
      taxAmount: taxAmount || 0,
      amountWithTax: amountWithTax || 0,
      remark: remark || null,
      reviewStatus: "DRAFT",
      items: items ? {
        create: items.map((item: Record<string, unknown>, idx: number) => ({
          appItemId: (item.appItemId as string) || null,
          itemName: (item.itemName as string) || "",
          taxClassificationCode: (item.taxClassificationCode as string) || (item.taxCode as string) || null,
          taxCodeId: (item.taxCodeId as string) || null,
          invoiceItemId: (item.invoiceItemId as string) || null,
          quantity: (item.quantity as number) || 1,
          unitPrice: (item.unitPrice as number) || 0,
          amount: (item.amount as number) || 0,
          taxRate: (item.taxRate as number) || 0,
          taxAmount: (item.taxAmount as number) || 0,
          totalAmount: (item.totalAmount as number) || 0,
          feeType: (item.feeType as string) || null,
          sortOrder: idx,
        })),
      } : undefined,
    },
    include: { items: true },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "pre_invoice",
      entityId: preInvoice.id,
      newValue: JSON.stringify({ preInvoiceNo }),
    },
  });

  // If sourced from application, update its status
  if (applicationId) {
    await db.outputInvoiceApplication.update({
      where: { id: applicationId },
      data: { status: "ISSUED" },
    });
  }

  return success(preInvoice, 201);
}
