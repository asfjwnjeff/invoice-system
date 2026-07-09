import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const where = search ? { buyerName: { contains: search } } : {};
  const items = await db.outputInvoiceApplication.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return success({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();

  const app = await db.outputInvoiceApplication.create({
    data: {
      appNo: body.appNo, sourceType: body.sourceType ?? "MANUAL", sourceId: body.sourceId ?? "", sellerOrgId: body.sellerOrgId, sellerTaxNo: body.sellerTaxNo ?? "", customerId: body.customerId ?? "", buyerName: body.buyerName, buyerTaxNo: body.buyerTaxNo, invoiceType: body.invoiceType,
      amountWithoutTax: body.amountWithoutTax ?? 0, taxAmount: body.taxAmount ?? 0, amountWithTax: body.amountWithTax ?? 0,
      remark: body.remark, createdBy: session.user.id,
      items: { create: (body.items ?? []).map((item: Record<string, unknown>) => ({ itemName: item.itemName as string, taxCode: (item.taxCode as string) ?? "", quantity: (item.quantity as number) ?? 1, unitPrice: (item.unitPrice as number) ?? 0, amount: (item.amount as number) ?? 0, taxRate: (item.taxRate as number) ?? 0, taxAmount: (item.taxAmount as number) ?? 0, amountWithTax: ((item.amount as number) ?? 0) + ((item.taxAmount as number) ?? 0) })) },
    },
    include: { items: true },
  });

  await db.operationLog.create({ data: { userId: session.user.id, action: "CREATE", entityType: "application", entityId: app.id } });
  return success(app, 201);
}
