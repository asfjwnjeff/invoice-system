import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { generateVoidNo } from "@/lib/invoice-number";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? "";
  const where = search ? { OR: [{ applicationNo: { contains: search } }, { voidCategory: { contains: search } }] } : {};
  const items = await db.voidApplication.findMany({ where, include: { invoice: { select: { invoiceNo: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return success({ items, total: items.length });
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();
  const app = await db.voidApplication.create({
    data: {
      applicationNo: body.applicationNo ?? generateVoidNo(),
      invoiceId: body.invoiceId ?? null,
      voidCategory: body.voidCategory ?? "LEGACY_VOID",
      voidReason: body.voidReason ?? "OTHER",
      reasonDetail: body.reasonDetail ?? "",
      status: body.status ?? "DRAFT",
    },
  });
  try { await db.operationLog.create({ data: { userId: session.user.id, action: "CREATE", entityType: "void", entityId: app.id } }); } catch { /* log failure should not block the API */ }
  return success(app, 201);
}
