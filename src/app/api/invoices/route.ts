import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const where = search ? { buyerName: { contains: search } } : {};
  const items = await db.outputInvoice.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return success({ items, total: items.length });
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
