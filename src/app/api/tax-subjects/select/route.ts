import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.taxSubject.findMany({
    select: { id: true, name: true, taxNo: true },
    orderBy: { name: "asc" },
  });
  return success({ items: items.map((i) => ({ id: i.id, label: `${i.name} - ${i.taxNo}` })) });
}
