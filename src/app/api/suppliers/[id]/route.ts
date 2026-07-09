import { auth } from '@/lib/auth';
import { supplierService } from '@/server/services/master-data';
import { success, error, notFound } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params;
  const r = await supplierService.getById(id); return r ? success(r) : notFound();
}
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params; const body = await req.json();
  const r = await supplierService.update(id, body, session.user.id);
  return r.success ? success(r.data) : error(r.errors?.[0]?.message ?? '更新失败');
}
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { id } = await params; await supplierService.delete(id, session.user.id);
  return success(null);
}
