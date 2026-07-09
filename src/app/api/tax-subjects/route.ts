import { auth } from '@/lib/auth';
import { taxSubjectService } from '@/server/services/master-data';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return error('未登录', 401);
  const search = req.nextUrl.searchParams.get('search') ?? undefined;
  const r = await .list(search);
  return success(r);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return error('未登录', 401);
  const body = await req.json();
  const r = await .create(body, session.user.id);
  return r.success ? success(r.data, 201) : error(r.errors?.[0]?.message ?? '创建失败');
}