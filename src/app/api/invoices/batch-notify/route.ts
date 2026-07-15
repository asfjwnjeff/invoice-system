import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";

// MOCK: Batch notify invoice applicants via email
export async function POST(req: Request) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { ids } = await req.json();
  if (!ids || !Array.isArray(ids) || ids.length === 0) return error("请选择发票");

  const now = new Date();
  let count = 0;
  for (const id of ids) {
    const invoice = await db.outputInvoice.findUnique({
      where: { id },
      include: { application: { select: { recipientEmail: true } } },
    });
    if (!invoice) continue;
    const recipient = invoice.application?.recipientEmail || "applicant@example.com";
    await db.outputInvoice.update({ where: { id }, data: { emailDeliveryStatus: "SENT", emailSentAt: now } });
    await db.invoiceDeliveryRecord.create({ data: { invoiceId: id, deliveryMethod: "EMAIL", recipientEmail: recipient, status: "DELIVERED", deliveredAt: now } });
    try { await db.operationLog.create({ data: { userId: session.user.id, action: "NOTIFY_APPLICANT", entityType: "output_invoice", entityId: id, newValue: JSON.stringify({ recipient, sentAt: now.toISOString() }) } }); } catch { /* ignore */ }
    count++;
  }

  return success({ count, sentAt: now.toISOString(), message: `已通知${count}张发票的开票申请人` });
}
