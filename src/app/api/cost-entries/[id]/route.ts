import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const entry = await db.costEntry.findUnique({
    where: { id },
    include: { businessOrder: true, supplier: true, costCenter: true },
  });
  if (!entry) return error("成本记录不存在", 404);

  // Also fetch linked input invoice if exists
  let inputInvoice = null;
  if (entry.inputInvoiceId) {
    inputInvoice = await db.inputInvoice.findUnique({
      where: { id: entry.inputInvoiceId },
      include: { items: true },
    });
  }

  return success({ ...entry, inputInvoice });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const body = await req.json();
  const { businessOrderId, supplierId, costCenterId, costType, description, amount, currency, occurredDate, remark, f01Status, c01Status } = body;

  const entry = await db.costEntry.update({
    where: { id },
    data: {
      businessOrderId: businessOrderId || undefined,
      supplierId: supplierId !== undefined ? supplierId : undefined,
      costCenterId: costCenterId !== undefined ? costCenterId : undefined,
      costType: costType !== undefined ? costType : undefined,
      description: description !== undefined ? description : undefined,
      amount: amount !== undefined ? amount : undefined,
      currency: currency || undefined,
      occurredDate: occurredDate ? new Date(occurredDate) : undefined,
      remark: remark !== undefined ? remark : undefined,
      f01Status: f01Status || undefined,
      c01Status: c01Status || undefined,
      status: f01Status === "UPLOADED" && c01Status === "REGISTERED" ? "COMPLETED" : (f01Status === "UPLOADED" ? "INVOICE_UPLOADED" : undefined),
    },
    include: { businessOrder: true, supplier: true, costCenter: true },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "UPDATE",
      entityType: "cost_entry",
      entityId: id,
    },
  });

  return success(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  await db.costEntry.delete({ where: { id } });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "DELETE",
      entityType: "cost_entry",
      entityId: id,
    },
  });

  return success({ deleted: true });
}
