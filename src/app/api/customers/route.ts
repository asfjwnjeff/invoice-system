import { auth } from "@/lib/auth";
import { customerService } from "@/server/services/customers";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

const ORG_ID = "org-default";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return error("未登录", 401);
  const search = req.nextUrl.searchParams.get("search") ?? undefined;
  const page = parseInt(req.nextUrl.searchParams.get("page") ?? "1");
  const r = await customerService.list({ search, page });
  return success(r);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return error("未登录", 401);
  const body = await req.json();
  const r = await customerService.create(body, session.user.id, ORG_ID);
  return r.success ? success(r.data, 201) : error(r.errors?.[0]?.message ?? "创建失败");
}
