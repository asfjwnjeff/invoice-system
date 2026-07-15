import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.preInvoice.findMany({
    select: { id: true, preInvoiceNo: true, buyerName: true },
    orderBy: { createdAt: "desc" },
  });
  return success({ items: items.map((i) => ({ id: i.id, label: `${i.preInvoiceNo} - ${i.buyerName}` })) });
}
