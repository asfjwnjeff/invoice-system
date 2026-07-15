import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [{ entryNo: { contains: search } }, { description: { contains: search } }];
  }
  if (status) {
    where.status = status;
  }

  const items = await db.costEntry.findMany({
    where,
    include: { businessOrder: true, supplier: true, costCenter: true },
    orderBy: { createdAt: "desc" },
  });

  return success({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();
  const { businessOrderId, supplierId, costCenterId, costType, description, amount, currency, occurredDate, remark } = body;

  if (!businessOrderId) return error("业务订单为必填项");

  const entryNo = `CE-${Date.now().toString(36).toUpperCase()}`;

  const entry = await db.costEntry.create({
    data: {
      entryNo,
      businessOrderId,
      supplierId: supplierId || null,
      costCenterId: costCenterId || null,
      costType: costType || null,
      description: description || null,
      amount: amount || 0,
      currency: currency || "CNY",
      occurredDate: occurredDate ? new Date(occurredDate) : null,
      status: "DRAFT",
      f01Status: "PENDING",
      c01Status: "PENDING",
      remark: remark || null,
      createdBy: session.user.id,
    },
    include: { businessOrder: true, supplier: true, costCenter: true },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "CREATE",
      entityType: "cost_entry",
      entityId: entry.id,
      newValue: JSON.stringify({ entryNo }),
    },
  });

  return success(entry, 201);
}
