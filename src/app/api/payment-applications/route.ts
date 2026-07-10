import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function GET() {
  const session = await auth(); if (!session) return error('未登录', 401);
  const items: Array<{id:string;payAppNo:string;supplierName:string;amount:number;status:string;createdAt:Date}> = [];
  return success({ items, total: items.length });
}
export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const body = await req.json();
  return success({ id: Date.now().toString(), ...body, status: "PENDING", createdAt: new Date().toISOString() }, 201);
}
