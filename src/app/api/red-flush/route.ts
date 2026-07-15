import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const search = req.nextUrl.searchParams.get('search') ?? '';
  const where = search ? { OR: [{ applicationNo: { contains: search } }] } : {};
  const items = await db.redFlushApplication.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 });
  return success({ items, total: items.length });
}
export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const body = await req.json();
  const app = await db.redFlushApplication.create({ data: { applicationNo: body.applicationNo, originalInvoiceId: body.originalInvoiceId, redFlushType: body.redFlushType, redFlushReason: body.redFlushReason, reasonDescription: body.reasonDescription ?? '', amountWithoutTax: body.amountWithoutTax ?? 0, taxAmount: body.taxAmount ?? 0, amountWithTax: body.amountWithTax ?? 0, needsReissue: body.needsReissue ?? false } });
  try { await db.operationLog.create({ data: { userId: session.user.id, action: 'CREATE', entityType: 'redFlush', entityId: app.id } }); } catch { /* log failure should not block the API */ }
  return success(app, 201);
}
