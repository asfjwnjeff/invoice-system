import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.revenueOrder.findMany({
    select: { id: true, orderNo: true, title: true },
    orderBy: { orderNo: "asc" },
  });
  return success({ items: items.map(o => ({ id: o.id, label: `${o.orderNo} ${o.title}` })) });
}
