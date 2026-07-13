import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, notFound } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const app = await db.outputInvoiceApplication.findUnique({
    where: { id },
    include: {
      items: true,
      customer: { select: { id: true, name: true, shortName: true } },
      revenueOrder: { select: { id: true, orderNo: true, title: true } },
      settlement: { select: { id: true, settlementNo: true, title: true } },
    },
  });
  return app ? success(app) : notFound();
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const body = await req.json();
  const { items, ...data } = body;
  const app = await db.outputInvoiceApplication.update({ where: { id }, data });
  if (items && Array.isArray(items)) {
    await db.outputInvoiceApplicationItem.deleteMany({ where: { applicationId: id } });
    for (const it of items) {
      await db.outputInvoiceApplicationItem.create({ data: { ...it, applicationId: id } });
    }
  }
  await db.operationLog.create({ data: { userId: session.user.id, action: "UPDATE", entityType: "application", entityId: id } });
  return success(app);
}
