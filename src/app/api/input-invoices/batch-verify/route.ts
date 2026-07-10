import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { ids } = await req.json();
  if (!Array.isArray(ids) || ids.length === 0) return error('请选择发票');

  let passed = 0; let failed = 0;
  for (const id of ids) {
    const mockResult = Math.random() > 0.1;
    await db.inputInvoice.update({ where: { id }, data: { verifyStatus: mockResult ? 'VERIFIED' : 'VERIFY_FAILED' } });
    if (mockResult) passed++; else failed++;
  }
  return success({ passed, failed, total: ids.length });
}
