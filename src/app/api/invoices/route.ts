import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const where = search ? { buyerName: { contains: search } } : {};
  const items = await db.outputInvoice.findMany({ where, include: { application: { select: { applicationNo: true } }, items: { select: { taxRate: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  const mapped = items.map(inv => {
    const rawItems = (inv as Record<string,unknown>).items as { taxRate: number }[] | undefined;
    const rates = [...new Set((rawItems ?? []).map(i => i.taxRate))];
    const { items: _, ...rest } = inv as Record<string,unknown>;
    return { ...rest, taxRates: rates };
  });
  return success({ items: mapped, total: mapped.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();

  const invoice = await db.outputInvoice.create({
    data: {
      invoiceNo: body.invoiceNo,
      invoiceCode: body.invoiceCode ?? null,
      invoiceCategory: body.invoiceCategory ?? "DIGITAL_SPECIAL",
      invoicePool: body.invoicePool ?? "OUTPUT",
      sellerName: body.sellerName ?? "",
      sellerTaxNo: body.sellerTaxNo ?? "",
      buyerName: body.buyerName ?? "",
      buyerTaxNo: body.buyerTaxNo ?? null,
      buyerAddress: body.buyerAddress ?? null,
      buyerPhone: body.buyerPhone ?? null,
      buyerBankName: body.buyerBankName ?? null,
      buyerBankAccount: body.buyerBankAccount ?? null,
      issueDate: body.issueDate ? new Date(body.issueDate) : null,
      amountWithoutTax: body.amountWithoutTax ?? 0,
      taxAmount: body.taxAmount ?? 0,
      amountWithTax: body.amountWithTax ?? 0,
      currency: body.currency ?? "CNY",
      taxSubjectId: body.taxSubjectId ?? "default",
      deliveryStatus: body.deliveryStatus ?? "PENDING",
      verifyStatus: body.verifyStatus ?? "PENDING",
      entryMethod: body.entryMethod ?? "MANUAL",
    },
  });

  // Create at least one invoice item if items provided or default
  const items: { itemName: string; quantity: number; unitPrice: number; amount: number; taxRate: number; taxAmount: number; totalAmount: number; spec?: string; unit?: string }[] = body.items ?? [{
    itemName: body.buyerName ? `${body.buyerName} 服务费` : "服务费",
    quantity: 1,
    unitPrice: body.amountWithoutTax ?? 0,
    amount: body.amountWithoutTax ?? 0,
    taxRate: body.amountWithoutTax > 0 ? Math.round((body.taxAmount ?? 0) / (body.amountWithoutTax || 1) * 100) : 0,
    taxAmount: body.taxAmount ?? 0,
    totalAmount: body.amountWithTax ?? 0,
  }];
  for (let i = 0; i < items.length; i++) {
    const it = items[i]!;
    await db.outputInvoiceItem.create({
      data: {
        invoiceId: invoice.id,
        itemName: it.itemName,
        spec: it.spec ?? null,
        unit: it.unit ?? null,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        amount: it.amount,
        taxRate: it.taxRate,
        taxAmount: it.taxAmount,
        totalAmount: it.totalAmount,
        sortOrder: i,
      },
    });
  }

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "outputInvoice",
      entityId: invoice.id,
    },
  });

  return success(invoice, 201);
}
