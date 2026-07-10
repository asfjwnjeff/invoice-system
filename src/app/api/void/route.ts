import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const search = req.nextUrl.searchParams.get('search') ?? '';
  const items = await db.voidApplication.findMany({ orderBy: { createdAt: 'desc' }, take: 100 });
  return success({ items, total: items.length });
}
export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const body = await req.json();
  const app = await db.voidApplication.create({ data: { appNo: body.appNo, targetType: body.targetType, targetId: body.targetId, voidCategory: body.voidCategory, voidReason: body.voidReason, reasonDetail: body.reasonDetail ?? '', createdBy: session.user.id } });
  await db.operationLog.create({ data: { userId: session.user.id, action: 'CREATE', entityType: 'void', entityId: app.id } });
  return success(app, 201);
}
