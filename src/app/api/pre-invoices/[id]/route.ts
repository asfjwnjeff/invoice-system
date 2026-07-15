import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const preInvoice = await db.preInvoice.findUnique({
    where: { id },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      application: { include: { revenueOrder: true, settlement: true } },
      outputInvoice: true,
    },
  });
  if (!preInvoice) return error("预制发票不存在", 404);

  return success(preInvoice);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const body = await req.json();
  const { invoiceCategory, buyerName, buyerTaxNo, buyerAddress, buyerPhone, buyerBankName, buyerBankAccount, sellerName, sellerTaxNo, remark, items } = body;

  const existing = await db.preInvoice.findUnique({ where: { id } });
  if (!existing) return error("预制发票不存在", 404);
  if (existing.reviewStatus !== "DRAFT" && existing.reviewStatus !== "REJECTED") {
    return error("仅草稿或已驳回状态可编辑");
  }

  // Delete existing items and recreate
  await db.preInvoiceItem.deleteMany({ where: { preInvoiceId: id } });

  const amountWithoutTax = items ? items.reduce((s: number, i: Record<string, unknown>) => s + ((i.amount as number) || 0), 0) : existing.amountWithoutTax;
  const taxAmount = items ? items.reduce((s: number, i: Record<string, unknown>) => s + ((i.taxAmount as number) || 0), 0) : existing.taxAmount;

  const preInvoice = await db.preInvoice.update({
    where: { id },
    data: {
      invoiceCategory: invoiceCategory || existing.invoiceCategory,
      buyerName: buyerName || existing.buyerName,
      buyerTaxNo: buyerTaxNo !== undefined ? buyerTaxNo : existing.buyerTaxNo,
      buyerAddress: buyerAddress !== undefined ? buyerAddress : existing.buyerAddress,
      buyerPhone: buyerPhone !== undefined ? buyerPhone : existing.buyerPhone,
      buyerBankName: buyerBankName !== undefined ? buyerBankName : existing.buyerBankName,
      buyerBankAccount: buyerBankAccount !== undefined ? buyerBankAccount : existing.buyerBankAccount,
      sellerName: sellerName !== undefined ? sellerName : existing.sellerName,
      sellerTaxNo: sellerTaxNo !== undefined ? sellerTaxNo : existing.sellerTaxNo,
      remark: remark !== undefined ? remark : existing.remark,
      amountWithoutTax,
      taxAmount,
      amountWithTax: amountWithoutTax + taxAmount,
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
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "pre_invoice",
      entityId: id,
    },
  });

  return success(preInvoice);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const existing = await db.preInvoice.findUnique({ where: { id } });
  if (!existing) return error("预制发票不存在", 404);
  if (existing.reviewStatus !== "DRAFT") return error("仅草稿状态可删除");

  await db.preInvoiceItem.deleteMany({ where: { preInvoiceId: id } });
  await db.preInvoice.delete({ where: { id } });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "pre_invoice",
      entityId: id,
    },
  });

  return success({ deleted: true });
}
