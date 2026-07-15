import { db } from "@/lib/db";
import { validate } from "@/lib/validators";
import { advancePaymentSchema, customsPaymentBookSchema } from "@/schemas/advance";
import type { ZodSchema } from "zod";

const ORG_ID = "org-default";

function crudService(
  entity: "advancePayment"|"customsPaymentBook",
  schema: ZodSchema,
  searchFields: string[],
  include?: Record<string, boolean | object>,
) {
  const model = db[entity];
  return {
    list: async (search?: string) => {
      const where = search ? { OR: searchFields.map(f => ({ [f]: { contains: search } })) } : {};
      const items = await (model as unknown as { findMany: (a: Record<string, unknown>) => Promise<unknown> }).findMany({ where, orderBy: { createdAt: "desc" }, take: 100, ...(include ? { include } : {}) });
      return { items, total: (items as unknown[]).length };
    },
    getById: (id: string) => (model as unknown as { findUnique: (a: Record<string, unknown>) => Promise<unknown> }).findUnique({ where: { id }, ...(include ? { include } : {}) }),
    create: async (input: unknown, userId: string) => {
      const r = validate(schema, input); if (!r.success) return r;
      const data = { ...(r.data as Record<string, unknown>), organizationId: ORG_ID, createdBy: userId };
      const item = await (model as unknown as { create: (a: { data: Record<string, unknown> }) => Promise<{ id: string }> }).create({ data });
      try { await db.operationLog.create({ data: { userId, action: "CREATE", entityType: entity as string, entityId: item.id } }); } catch { /* log failure should not block the API */ }
      return { success: true as const, data: item };
    },
    update: async (id: string, input: unknown, userId: string) => {
      const r = validate((schema as unknown as { partial: () => ZodSchema }).partial(), input); if (!r.success) return r;
      await (model as unknown as { update: (a: Record<string, unknown>) => Promise<unknown> }).update({ where: { id }, data: r.data as Record<string, unknown> });
      try { await db.operationLog.create({ data: { userId, action: "UPDATE", entityType: entity as string, entityId: id } }); } catch { /* log failure should not block the API */ }
      return { success: true as const };
    },
    delete: async (id: string, userId: string) => {
      await (model as unknown as { delete: (a: Record<string, unknown>) => Promise<unknown> }).delete({ where: { id } });
      try { await db.operationLog.create({ data: { userId, action: "DELETE", entityType: entity as string, entityId: id } }); } catch { /* log failure should not block the API */ }
      return { success: true as const };
    },
  };
}

export const advancePaymentService = crudService("advancePayment", advancePaymentSchema, ["advanceNo", "feeType"], { customer: true, businessOrder: true });
export const customsPaymentBookService = crudService("customsPaymentBook", customsPaymentBookSchema, ["bookNo", "customsDeclarationNo"]);
