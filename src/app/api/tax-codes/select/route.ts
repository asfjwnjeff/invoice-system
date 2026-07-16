import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.taxCode.findMany({
    select: { id: true, code: true, name: true, taxRate: true },
    orderBy: { code: "asc" },
  });
  return success({ items: items.map(t => ({ id: t.id, label: `${t.code} — ${t.name} (${t.taxRate}%)` })) });
}
