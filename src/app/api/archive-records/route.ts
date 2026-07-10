import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const search = req.nextUrl.searchParams.get('search') ?? '';
  const where = search ? { entityType: { contains: search } } : {};
  const items = await db.archiveRecord.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  return success({ items, total: items.length });
}
