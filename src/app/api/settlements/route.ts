import { auth } from "@/lib/auth";
import { settlementService } from "@/server/services/business";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  return success(await settlementService.list(req.nextUrl.searchParams.get("search") ?? undefined));
}
export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const body = await req.json();
  const r = await settlementService.create(body, session.user.id);
  return r.success ? success(r.data, 201) : error(r.errors?.[0]?.message ?? "创建失败");
}
