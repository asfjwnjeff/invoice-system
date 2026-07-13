import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, notFound } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  const app = await db.redFlushApplication.findUnique({ where: { id } });
  return app ? success(app) : notFound();
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  await db.redFlushApplication.delete({ where: { id } });
  await db.operationLog.create({ data: { userId: session.user.id, action: 'DELETE', entityType: 'redFlush', entityId: id } });
  return success(null);
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  const body = await req.json();
  await db.redFlushApplication.update({ where: { id }, data: body });
  await db.operationLog.create({ data: { userId: session.user.id, action: 'UPDATE', entityType: 'redFlush', entityId: id } });
  return success(null);
}
