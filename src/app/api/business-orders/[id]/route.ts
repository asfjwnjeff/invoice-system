import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { businessOrderService } from "@/server/services/business";
import { success, error, notFound } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const r = await db.businessOrder.findUnique({
    where: { id },
    include: {
      customer: true,
      revenueOrders: { select: { id: true, orderNo: true, title: true, totalRevenueAmount: true, invoiceStatus: true } },
      advancePayments: { select: { id: true, advanceNo: true, feeType: true, originalAmount: true, currency: true, collectionStatus: true } },
      feeItems: { select: { id: true, feeNo: true, description: true, amount: true, feeType: true } },
      inputInvoices: { select: { id: true, invoiceNo: true, supplier: { select: { name: true } }, amountWithTax: true, costCenter: { select: { name: true } }, deductStatus: true } },
    },
  });
  return r ? success(r) : notFound();
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params; const body = await req.json();
  const r = await businessOrderService.update(id, body, session.user.id);
  return r.success ? success(r.data) : error(r.errors?.[0]?.message ?? "更新失败");
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params; await businessOrderService.delete(id, session.user.id); return success(null);
}
