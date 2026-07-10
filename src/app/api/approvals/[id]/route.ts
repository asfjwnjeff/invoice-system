import { auth } from '@/lib/auth';
import { approvalService } from '@/server/services/approval';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  const body = await req.json();
  if (body.action === 'approve') {
    const r = await approvalService.approve(id, session.user.id, session.user.name ?? '', body.comment);
    return r.success ? success(r) : error(r.error ?? '操作失败');
  }
  if (body.action === 'reject') {
    const r = await approvalService.reject(id, session.user.id, session.user.name ?? '', body.comment);
    return r.success ? success(r) : error(r.error ?? '操作失败');
  }
  return error('未知操作');
}
