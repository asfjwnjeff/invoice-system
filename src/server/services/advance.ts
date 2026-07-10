import { db } from "@/lib/db";
import { validate } from "@/lib/validators";
import { advancePaymentSchema, customsPaymentBookSchema } from "@/schemas/advance";
import type { ZodSchema } from "zod";

const ORG_ID = "org-default";

function crudService(entity: "advancePayment"|"customsPaymentBook", schema: ZodSchema, searchFields: string[]) {
  const model = db[entity];
  return {
    list: async (search?: string) => {
      const where = search ? { OR: searchFields.map(f => ({ [f]: { contains: search } })) } : {};
      const items = await (model as { findMany: (a: Record<string, unknown>) => unknown }).findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
      return { items, total: (items as unknown[]).length };
    },
    getById: (id: string) => (model as { findUnique: (a: Record<string, unknown>) => unknown }).findUnique({ where: { id } }),
    create: async (input: unknown, userId: string) => {
      const r = validate(schema, input); if (!r.success) return r;
      const data = { ...(r.data as Record<string, unknown>), organizationId: ORG_ID, createdBy: userId };
      const item = await (model as { create: (a: { data: Record<string, unknown> }) => Promise<{ id: string }> }).create({ data });
      await db.operationLog.create({ data: { userId, action: "CREATE", entityType: entity as string, entityId: item.id } });
      return { success: true as const, data: item };
    },
    update: async (id: string, input: unknown, userId: string) => {
      const r = validate(schema.partial() as ZodSchema, input); if (!r.success) return r;
      await (model as { update: (a: Record<string, unknown>) => unknown }).update({ where: { id }, data: r.data as Record<string, unknown> });
      await db.operationLog.create({ data: { userId, action: "UPDATE", entityType: entity as string, entityId: id } });
      return { success: true as const };
    },
    delete: async (id: string, userId: string) => {
      await (model as { delete: (a: Record<string, unknown>) => unknown }).delete({ where: { id } });
      await db.operationLog.create({ data: { userId, action: "DELETE", entityType: entity as string, entityId: id } });
      return { success: true as const };
    },
  };
}

export const advancePaymentService = crudService("advancePayment", advancePaymentSchema, ["advanceNo", "feeType"]);
export const customsPaymentBookService = crudService("customsPaymentBook", customsPaymentBookSchema, ["taxBillNo", "customsDeclNo"]);
