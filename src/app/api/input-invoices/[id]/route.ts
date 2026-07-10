import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error, notFound } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  const inv = await db.inputInvoice.findUnique({ where: { id } });
  return inv ? success(inv) : notFound();
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  await db.inputInvoice.delete({ where: { id } });
  return success(null);
}
