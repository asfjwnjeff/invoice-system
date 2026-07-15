import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.outputInvoice.findMany({
    select: { id: true, invoiceNo: true, buyerName: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return success({ items: items.map((i) => ({ id: i.id, label: `${i.invoiceNo} - ${i.buyerName}` })) });
}
