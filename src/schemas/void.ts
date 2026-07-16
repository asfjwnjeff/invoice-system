import { z } from "zod";

export const voidApplicationSchema = z.object({
  applicationNo: z.string().min(1),
  invoiceId: z.string().optional(),
  voidCategory: z.string().min(1),
  voidReason: z.string().min(1),
  reasonDetail: z.string().optional(),
  status: z.string().optional(),
});

export type VoidApplicationInput = z.infer<typeof voidApplicationSchema>;
