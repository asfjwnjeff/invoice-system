import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";

// MOCK: Push invoice to CBMS + send email. Replace with real 链票 API.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const invoice = await db.outputInvoice.findUnique({
    where: { id },
    include: { application: true, preInvoice: true },
  });
  if (!invoice) return error("发票不存在", 404);
  if (invoice.pushToCBMSStatus === "PUSHED" && invoice.emailDeliveryStatus === "SENT") {
    return error("发票已推送");
  }

  const now = new Date();

  // ① Mock CBMS sync: Mark the invoice as pushed back to CBMS for bill-invoice association
  const cbmsSyncResult = {
    status: "SUCCESS",
    message: "账票关联成功",
    syncAt: now.toISOString(),
  };

  // ② Mock email delivery: Create delivery record and mark email sent
  const recipientEmail = invoice.application?.recipientEmail || invoice.preInvoice?.buyerPhone || "";
  const emailResult = {
    status: "SUCCESS",
    recipient: recipientEmail || "applicant@example.com",
    sentAt: now.toISOString(),
  };

  // Update invoice push statuses
  await db.outputInvoice.update({
    where: { id },
    data: {
      pushToCBMSStatus: "PUSHED",
      emailDeliveryStatus: "SENT",
      emailSentAt: now,
      deliveryStatus: "DELIVERED",
    },
  });

  // Create delivery record
  await db.invoiceDeliveryRecord.create({
    data: {
      invoiceId: id,
      deliveryMethod: "EMAIL",
      recipientEmail: recipientEmail || "applicant@example.com",
      status: "DELIVERED",
      deliveredAt: now,
    },
  });

  // Also update pre-invoice delivery status if exists
  if (invoice.preInvoice) {
    await db.preInvoice.update({
      where: { id: invoice.preInvoice.id },
      data: { deliveryStatus: "DELIVERED" },
    });
  }

  await db.operationLog.create({
    data: {
      userId: session.user.id,
      action: "PUSH_CHAIN",
      entityType: "output_invoice",
      entityId: id,
      newValue: JSON.stringify({ cbmsSync: cbmsSyncResult, email: emailResult }),
    },
  });

  return success({
    invoiceNo: invoice.invoiceNo,
    cbmsSync: cbmsSyncResult,
    emailDelivery: emailResult,
    message: "发票已推送至CBMS并邮件通知开票申请人",
  });
}
