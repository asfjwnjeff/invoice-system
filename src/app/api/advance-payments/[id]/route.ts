import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, notFound } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const r = await db.advancePayment.findUnique({ where: { id }, include: { organization: { select: { name: true } }, supplier: { select: { name: true } } } });
  return r ? success(r) : notFound();
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const body = await req.json();
  const { id: _, advanceNo, createdAt, updatedAt, creator, organization, supplier, settlementItems, ...rest } = body;
  if (rest.occurredDate) rest.occurredDate = new Date(rest.occurredDate);
  const item = await db.advancePayment.update({ where: { id }, data: rest });
  try { await db.operationLog.create({ data: { userId: session.user.id, action: "UPDATE", entityType: "advancePayment", entityId: id } }); } catch { /* log failure should not block the API */ }
  return success(item);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  await db.advancePayment.delete({ where: { id } });
  return success(null);
}
