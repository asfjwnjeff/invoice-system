import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// MOCK: Batch sync invoices from tax bureau
export async function POST(req: Request) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) return error("请选择发票");

  const now = new Date();
  let count = 0;
  for (const id of ids) {
    const invoice = await db.outputInvoice.findUnique({ where: { id } });
    if (!invoice) continue;
    try { await db.operationLog.create({ data: { userId: session.user.id, action: "SYNC_TAX", entityType: "output_invoice", entityId: id, newValue: JSON.stringify({ syncedAt: now.toISOString() }) } }); } catch { /* ignore */ }
    count++;
  }

  return success({ count, syncedAt: now.toISOString(), message: `已同步${count}张发票` });
}
