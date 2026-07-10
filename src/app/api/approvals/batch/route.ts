import { auth } from '@/lib/auth';
import { approvalService } from '@/server/services/approval';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { action, ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return error('请选择审批项');
  let count = 0;
  for (const id of ids) {
    const r = action === 'approve' ? await approvalService.approve(id, session.user.id, session.user.name ?? '') : await approvalService.reject(id, session.user.id, session.user.name ?? '');
    if (r.success) count++;
  }
  return success({ count, total: ids.length });
}
