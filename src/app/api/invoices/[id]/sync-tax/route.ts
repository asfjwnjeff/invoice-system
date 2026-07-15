import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

// MOCK: Sync invoice data from tax bureau
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const invoice = await db.outputInvoice.findUnique({ where: { id } });
  if (!invoice) return error("发票不存在", 404);

  // Mock: Simulate syncing latest data from tax bureau (does not change verify status)
  const now = new Date();

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "SYNC_TAX",
      entityType: "output_invoice",
      entityId: id,
      newValue: JSON.stringify({ syncedAt: now.toISOString() }),
    },
  });

  return success({
    invoiceNo: invoice.invoiceNo,
    syncedAt: now.toISOString(),
    message: `已从税局同步发票 ${invoice.invoiceNo} 的最新数据`,
  });
}
