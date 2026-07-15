import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const where = search ? { buyerName: { contains: search } } : {};
  const items = await db.outputInvoiceApplication.findMany({ where, include: { taxSubject: { select: { id: true, name: true, taxNo: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return success({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();

  const tsid = body.taxSubjectId || "";
  const cid = body.customerId || "";

  const app = await db.outputInvoiceApplication.create({
    data: {
      applicationNo: body.applicationNo ?? body.appNo,
      sourceType: body.sourceType ?? "MANUAL",
      sourceId: body.sourceId ?? null,
      taxSubjectId: tsid,
      customerId: cid,
      buyerName: body.buyerName || "",
      buyerTaxNo: body.buyerTaxNo,
      buyerAddress: body.buyerAddress,
      buyerPhone: body.buyerPhone,
      buyerBankName: body.buyerBankName,
      buyerBankAccount: body.buyerBankAccount,
      invoiceCategory: body.invoiceCategory ?? body.invoiceType,
      amountWithoutTax: body.amountWithoutTax ?? 0,
      taxAmount: body.taxAmount ?? 0,
      amountWithTax: body.amountWithTax ?? 0,
      currency: body.currency ?? "CNY",
      remark: body.remark,
      cashierName: body.cashierName,
      reviewerName: body.reviewerName,
      drawerName: body.drawerName,
      createdBy: session.user.id,
      items: {
        create: (body.items ?? []).map((item: Record<string, unknown>, idx: number) => ({
          itemName: (item.itemName as string) ?? "",
          taxClassificationCode: (item.taxClassificationCode as string) ?? (item.taxCode as string) ?? "",
          spec: (item.spec as string) ?? null,
          unit: (item.unit as string) ?? null,
          quantity: (item.quantity as number) ?? 1,
          unitPrice: (item.unitPrice as number) ?? 0,
          amount: (item.amount as number) ?? 0,
          taxRate: (item.taxRate as number) ?? 0,
          taxAmount: (item.taxAmount as number) ?? 0,
          totalAmount: ((item.amount as number) ?? 0) + ((item.taxAmount as number) ?? 0),
          sortOrder: idx,
        })),
      },
    },
    include: { items: true },
  });

  await db.operationLog.create({ data: { userId: session.user.id, action: "CREATE", entityType: "application", entityId: app.id } });
  return success(app, 201);
}
