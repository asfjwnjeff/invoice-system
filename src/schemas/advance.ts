import { z } from "zod";

export const advancePaymentSchema = z.object({
  advanceNo: z.string().min(1),
  customerId: z.string().min(1),
  businessOrderId: z.string().min(1),
  customsDeclarationNo: z.string().optional(),
  feeType: z.string().min(1),
  occurredDate: z.string().min(1),
  currency: z.string().default("CNY"),
  originalAmount: z.number().min(0),
  exchangeRate: z.number().default(1),
  baseCurrencyAmount: z.number().min(0),
  payerType: z.string().default("COMPANY"),
  invoiceStrategy: z.string().default("NO_INVOICE"),
  remark: z.string().optional(),
});

export type AdvancePaymentInput = z.infer<typeof advancePaymentSchema>;

export const customsPaymentBookSchema = z.object({
  taxBillNo: z.string().min(1),
  customsDeclNo: z.string().min(1),
  type: z.string().min(1),
  taxType: z.string().min(1),
  taxAmount: z.number().min(0),
  paymentDate: z.string().min(1),
  taxpayer: z.string().min(1),
  isAdvance: z.boolean().default(false),
});

export type CustomsPaymentBookInput = z.infer<typeof customsPaymentBookSchema>;
