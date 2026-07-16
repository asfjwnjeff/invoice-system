import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { generateApplicationNo } from '@/lib/invoice-number';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { settlementIds } = await req.json();
  if (!Array.isArray(settlementIds) || settlementIds.length === 0) return error('请选择结算单');

  const results: Array<{ settlementNo: string; applicationNo: string }> = [];
  for (const sid of settlementIds) {
    const stl = await db.settlement.findUnique({ where: { id: sid } });
    if (!stl) continue;
    const applicationNo = generateApplicationNo();
    await db.outputInvoiceApplication.create({
      data: {
        applicationNo,
        sourceType: "SETTLEMENT",
        sourceId: stl.id,
        taxSubjectId: "",
        customerId: stl.customerId ?? "",
        buyerName: "",
        invoiceCategory: "DIGITAL_SPECIAL",
        amountWithoutTax: stl.totalAmount,
        amountWithTax: stl.totalAmount,
      },
    });
    results.push({ settlementNo: stl.settlementNo, applicationNo });
  }
  return success({ created: results.length, details: results });
}
