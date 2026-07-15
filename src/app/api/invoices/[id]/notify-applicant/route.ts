import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

// MOCK: Send email notification to invoice applicant
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const invoice = await db.outputInvoice.findUnique({
    where: { id },
    include: { application: { select: { recipientEmail: true, buyerName: true } } },
  });
  if (!invoice) return error("发票不存在", 404);

  const recipient = invoice.application?.recipientEmail || "applicant@example.com";
  const now = new Date();

  // Mock: Simulate sending email
  await db.outputInvoice.update({
    where: { id },
    data: {
      emailDeliveryStatus: "SENT",
      emailSentAt: now,
    },
  });

  // Create delivery record
  await db.invoiceDeliveryRecord.create({
    data: {
      invoiceId: id,
      deliveryMethod: "EMAIL",
      recipientEmail: recipient,
      status: "DELIVERED",
      deliveredAt: now,
    },
  });

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "NOTIFY_APPLICANT",
      entityType: "output_invoice",
      entityId: id,
      newValue: JSON.stringify({ recipient, sentAt: now.toISOString() }),
    },
  });

  return success({
    invoiceNo: invoice.invoiceNo,
    recipient,
    sentAt: now.toISOString(),
    message: `已通知开票申请人（${recipient}），邮件发送成功`,
  });
}
