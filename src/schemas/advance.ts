import { z } from "zod";

export const advancePaymentSchema = z.object({
  advanceNo: z.string().min(1),
  organizationId: z.string().min(1),
  zone: z.string().optional(),
  supplierId: z.string().optional(),
  bankAccountNo: z.string().optional(),
  feeType: z.string().min(1),
  occurredDate: z.string().min(1),
  currency: z.string().default("CNY"),
  originalAmount: z.number().min(0),
  businessOrderNo: z.string().optional(),
  mawbNo: z.string().optional(),
  remark: z.string().optional(),
  status: z.string().optional(),
  collectionStatus: z.string().optional(),
  writeOffStatus: z.string().optional(),
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
