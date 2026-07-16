import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { generateInvoiceNo } from "@/lib/invoice-number";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const where = search ? { OR: [{ advanceNo: { contains: search } }, { feeType: { contains: search } }, { businessOrderNo: { contains: search } }] } : {};
  const items = await db.advancePayment.findMany({
    where,
    include: { organization: { select: { name: true } }, supplier: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return success({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();
  const advanceNo = body.advanceNo || `ADV-${generateInvoiceNo().slice(2)}`;
  const data = {
    advanceNo,
    organizationId: body.organizationId || "",
    zone: body.zone ?? null,
    supplierId: body.supplierId ?? null,
    bankAccountNo: body.bankAccountNo ?? null,
    feeType: body.feeType ?? "",
    occurredDate: body.occurredDate ? new Date(body.occurredDate) : new Date(),
    currency: body.currency ?? "CNY",
    originalAmount: body.originalAmount ?? body.amount ?? 0,
    businessOrderNo: body.businessOrderNo ?? body.orderNo ?? null,
    mawbNo: body.mawbNo ?? null,
    remark: body.remark ?? body.note ?? null,
    status: body.status ?? "DRAFT",
    collectionStatus: body.collectionStatus ?? "PENDING",
    writeOffStatus: body.writeOffStatus ?? "PENDING",
    createdBy: session.user.id,
  };
  const item = await db.advancePayment.create({ data });
  try { await db.operationLog.create({ data: { userId: session.user.id, action: "CREATE", entityType: "advancePayment", entityId: item.id } }); } catch { /* log failure should not block the API */ }
  return success(item, 201);
}
