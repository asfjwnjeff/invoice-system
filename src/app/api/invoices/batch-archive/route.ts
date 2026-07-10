import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { invoiceIds } = await req.json();
  if (!Array.isArray(invoiceIds) || invoiceIds.length === 0) return error('请选择发票');
  let count = 0;
  for (const id of invoiceIds) {
    await db.outputInvoice.update({ where: { id }, data: { archiveStatus: "ARCHIVED" } });
    count++;
  }
  return success({ archived: count });
}
