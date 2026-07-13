import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET() {
  const session = await auth(); if (!session) return error("未登录", 401);
  const items = await db.settlement.findMany({
    select: { id: true, settlementNo: true, title: true },
    orderBy: { settlementNo: "asc" },
  });
  return success({ items: items.map(s => ({ id: s.id, label: `${s.settlementNo} ${s.title}` })) });
}
