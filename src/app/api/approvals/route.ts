import { auth } from '@/lib/auth';
import { approvalService } from '@/server/services/approval';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const filter = req.nextUrl.searchParams.get('filter');
  if (filter === 'my') return success(await approvalService.myPending(session.user.role));
  return success(await approvalService.listAll());
}

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const body = await req.json();
  if (body.action === 'submit') {
    const r = await approvalService.submit(body.entityType, body.entityId, body.entityTitle ?? '', session.user.id, body.amount);
    return r.success ? success(r.data, 201) : error(r.error ?? '提交失败');
  }
  return error('未知操作');
}
