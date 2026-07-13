import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const search = req.nextUrl.searchParams.get('search') ?? '';
  const where = search ? { OR: [{ invoiceNo: { contains: search } }, { sellerName: { contains: search } }] } : {};
  const items = await db.inputInvoice.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100, include: { supplier: true, costCenter: true } });
  return success({ items, total: items.length });
}
export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const body = await req.json();
  const inv = await db.inputInvoice.create({ data: { ...body, issueDate: body.issueDate ? new Date(body.issueDate) : undefined, status: 'PENDING_VERIFY' } });
  await db.operationLog.create({ data: { userId: session.user.id, action: 'CREATE', entityType: 'inputInvoice', entityId: inv.id } });
  return success(inv, 201);
}
