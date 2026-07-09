import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  shortName: z.string().optional(),
  taxNo: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  invoiceStrategy: z.enum(["NO_INVOICE", "SEPARATE_INVOICE", "MERGE_WITH_SERVICE", "SERVICE_ONLY", "NET_AMOUNT", "MANUAL"]).default("NO_INVOICE"),
  isBlacklisted: z.boolean().default(false),
  remark: z.string().optional(),
});

export type CustomerInput = z.infer<typeof customerSchema>;
