import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { success, error } from "@/lib/api-response";
import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth(); if (!session) return error("未登录", 401);
  const { id } = await params;

  const app = await db.outputInvoiceApplication.findUnique({ where: { id } });
  if (!app) return error("申请不存在", 404);
  if (app.status === "ISSUED") return error("已开具，不能重复开票");

  const invoiceNo = `INV-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 4).toUpperCase()}`;
  const taxFlowNo = `TAX-${randomUUID().slice(0, 8).toUpperCase()}`;

  const invoice = await db.outputInvoice.create({
    data: {
      invoiceNo, applicationId: app.id, invoiceCategory: app.invoiceCategory,
      sellerName: "", sellerTaxNo: app.sellerTaxNo, buyerName: app.buyerName, buyerTaxNo: app.buyerTaxNo,
      issueDate: new Date(), amountWithoutTax: app.amountWithoutTax, taxAmount: app.taxAmount, amountWithTax: app.amountWithTax,
    },
  });

  await db.outputInvoiceApplication.update({ where: { id }, data: { status: "ISSUED", invoiceNo } });
  await db.operationLog.create({ data: { userId: session.user.id, action: "ISSUE", entityType: "application", entityId: id } });

  return success({ invoiceNo, taxFlowNo, invoiceId: invoice.id, status: "ISSUED" });
}
