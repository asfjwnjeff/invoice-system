import { z } from "zod";

export const supplierSchema = z.object({
  name: z.string().min(1, "名称不能为空"),
  shortName: z.string().optional(),
  taxNo: z.string().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().optional(),
  supplierType: z.string().optional(),
  isBlacklisted: z.boolean().default(false),
  remark: z.string().optional(),
});

export type SupplierInput = z.infer<typeof supplierSchema>;

// organization
export const orgSchema = z.object({ name: z.string().min(1), shortName: z.string().optional(), code: z.string().optional(), description: z.string().optional() });
export type OrgInput = z.infer<typeof orgSchema>;

// tax subject
export const taxSubjectSchema = z.object({ name: z.string().min(1), taxNo: z.string().min(1), isDefault: z.boolean().default(false) });
export type TaxSubjectInput = z.infer<typeof taxSubjectSchema>;

// invoice item
export const invoiceItemSchema = z.object({ name: z.string().min(1), taxCode: z.string().optional(), unit: z.string().optional(), feeType: z.string().optional() });
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;

// tax code
export const taxCodeSchema = z.object({ code: z.string().min(1), name: z.string().min(1), description: z.string().optional() });
export type TaxCodeInput = z.infer<typeof taxCodeSchema>;
