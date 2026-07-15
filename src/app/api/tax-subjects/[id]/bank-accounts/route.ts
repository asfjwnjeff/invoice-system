import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;
  const accounts = await db.taxSubjectBankAccount.findMany({
    where: { taxSubjectId: id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return success({ items: accounts.map(a => ({ id: a.id, label: `${a.bankName} - ${a.bankAccount}${a.isDefault ? " (默认)" : ""}`, bankName: a.bankName, bankAccount: a.bankAccount, isDefault: a.isDefault })) });
}
