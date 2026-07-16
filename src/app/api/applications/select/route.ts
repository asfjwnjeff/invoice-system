import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.outputInvoiceApplication.findMany({
    select: { id: true, applicationNo: true, buyerName: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return success({ items: items.map(a => ({ id: a.id, label: `${a.applicationNo} — ${a.buyerName}` })) });
}
