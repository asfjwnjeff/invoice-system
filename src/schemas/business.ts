import { z } from "zod";

export const businessOrderSchema = z.object({ orderNo: z.string().min(1), orderType: z.string().min(1), title: z.string().min(1), customerId: z.string().min(1), remark: z.string().optional() });
export type BusinessOrderInput = z.infer<typeof businessOrderSchema>;

export const feeItemSchema = z.object({ name: z.string().min(1), amount: z.number().min(0), feeType: z.string().min(1), businessOrderId: z.string().min(1), taxCode: z.string().optional(), remark: z.string().optional() });
export type FeeItemInput = z.infer<typeof feeItemSchema>;

export const revenueOrderSchema = z.object({ orderNo: z.string().min(1), title: z.string().min(1), businessOrderId: z.string().min(1), customerId: z.string().min(1), totalRevenueAmount: z.number().min(0), availableAmount: z.number().min(0), remark: z.string().optional() });
export type RevenueOrderInput = z.infer<typeof revenueOrderSchema>;

export const settlementSchema = z.object({ settlementNo: z.string().min(1), settlementType: z.string().min(1), customerId: z.string().min(1), revenueOrderId: z.string().min(1), amountWithoutTax: z.number().min(0), taxAmount: z.number().min(0), amountWithTax: z.number().min(0), remark: z.string().optional() });
export type SettlementInput = z.infer<typeof settlementSchema>;
