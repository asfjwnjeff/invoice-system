import { db } from "@/lib/db";;
import { validate } from "@/lib/validators";
import { supplierSchema, orgSchema, taxSubjectSchema, invoiceItemSchema, taxCodeSchema, type SupplierInput, type OrgInput, type TaxSubjectInput, type InvoiceItemInput, type TaxCodeInput } from "@/schemas/master-data";
import type { ZodSchema } from "zod";

const ORG_ID = "org-default";

async function crudList(entity: string, search?: string, searchFields?: string[]) {
  const where = search && searchFields?.length ? { OR: searchFields.map((f) => ({ [f]: { contains: search } })) } : {};
  const items = await (db as Record<string, { findMany: (a: unknown) => unknown }>)[entity].findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return { items, total: Array.isArray(items) ? items.length : 0 };
}

async function crudCreate(entity: string, data: Record<string, unknown>, orgId: string) {
  return (db as Record<string, { create: (a: { data: unknown }) => unknown }>)[entity].create({ data: { ...data, organizationId: orgId } });
}

async function crudUpdate(entity: string, id: string, data: Record<string, unknown>) {
  return (db as Record<string, { update: (a: { where: { id: string }; data: unknown }) => unknown }>)[entity].update({ where: { id }, data });
}

async function crudDelete(entity: string, id: string) {
  return (db as Record<string, { delete: (a: { where: { id: string } }) => unknown }>)[entity].delete({ where: { id } });
}

function createService<T>(entity: string, schema: ZodSchema<T>, searchFields: string[]) {
  return {
    list: (search?: string) => crudList(entity, search, searchFields),
    getById: (id: string) => (db as Record<string, { findUnique: (a: { where: { id: string } }) => unknown }>)[entity].findUnique({ where: { id } }),
    create: async (input: unknown, userId: string) => {
      const r = validate(schema, input);
      if (!r.success) return r;
      const item = await crudCreate(entity, r.data as Record<string, unknown>, ORG_ID);
      await db.operationLog.create({ data: { userId, action: "CREATE", entityType: entity, entityId: (item as { id: string }).id } });
      return { success: true as const, data: item };
    },
    update: async (id: string, input: unknown, userId: string) => {
      const r = validate(schema.partial() as ZodSchema<T>, input);
      if (!r.success) return r;
      const item = await crudUpdate(entity, id, r.data as Record<string, unknown>);
      await db.operationLog.create({ data: { userId, action: "UPDATE", entityType: entity, entityId: id } });
      return { success: true as const, data: item };
    },
    delete: async (id: string, userId: string) => {
      await crudDelete(entity, id);
      await db.operationLog.create({ data: { userId, action: "DELETE", entityType: entity, entityId: id } });
      return { success: true as const };
    },
  };
}

export const supplierService = createService("supplier", supplierSchema, ["name", "taxNo"]);
export const orgService = createService("organization", orgSchema, ["name", "code"]);
export const taxSubjectService = createService("taxSubject", taxSubjectSchema, ["name", "taxNo"]);
export const invoiceItemService = createService("invoiceItem", invoiceItemSchema, ["name", "taxCode"]);
export const taxCodeService = createService("taxCode", taxCodeSchema, ["code", "name"]);
