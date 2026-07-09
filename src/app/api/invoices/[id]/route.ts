import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error, notFound } from "@/lib/api-response";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const inv = await db.outputInvoice.findUnique({ where: { id }, include: { application: { include: { items: true } } } });
  return inv ? success(inv) : notFound();
}
