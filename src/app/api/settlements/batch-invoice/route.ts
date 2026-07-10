import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { success, error } from '@/lib/api-response';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const session = await auth(); if (!session) return error('未登录', 401);
  const { settlementIds } = await req.json();
  if (!Array.isArray(settlementIds) || settlementIds.length === 0) return error('请选择结算单');

  const results: Array<{ settlementNo: string; appNo: string }> = [];
  for (const sid of settlementIds) {
    const stl = await db.settlement.findUnique({ where: { id: sid } });
    if (!stl) continue;
    const appNo = `APP-BATCH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
    await db.outputInvoiceApplication.create({ data: { appNo, sourceType:"SETTLEMENT", sourceId:stl.id, sellerOrgId: stl.organizationId, sellerTaxNo:"", customerId:stl.customerId??"", buyerName:"", invoiceType:"DIGITAL_SPECIAL", amountWithoutTax:stl.amountWithoutTax, taxAmount:stl.taxAmount, amountWithTax:stl.amountWithTax, createdBy:session.user.id } });
    results.push({ settlementNo: stl.settlementNo, appNo });
  }
  return success({ created: results.length, details: results });
}
