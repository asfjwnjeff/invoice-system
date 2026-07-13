import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.customer.findMany({
    where: { isActive: true },
    select: { id: true, name: true, shortName: true },
    orderBy: { name: "asc" },
  });
  return success({ items: items.map(c => ({ id: c.id, label: c.shortName ? `${c.name} (${c.shortName})` : c.name })) });
}
