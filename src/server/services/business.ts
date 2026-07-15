import { db } from "@/lib/db";
import { validate } from "@/lib/validators";
import { businessOrderSchema, feeItemSchema, revenueOrderSchema, settlementSchema } from "@/schemas/business";
import type { ZodSchema } from "zod";

const ORG_ID = "org-default";

type DbModel = keyof typeof db;

function createService(
  entity: DbModel,
  schema: ZodSchema,
  searchFields: string[],
  extraCreateData?: Record<string, unknown>,
  include?: Record<string, boolean | object>,
) {
  const model = db[entity] as unknown as {
    findMany: (a: Record<string, unknown>) => Promise<unknown[]>;
    findUnique: (a: Record<string, unknown>) => Promise<unknown>;
    create: (a: { data: Record<string, unknown> }) => Promise<{ id: string }>;
    update: (a: Record<string, unknown>) => Promise<unknown>;
    delete: (a: Record<string, unknown>) => Promise<unknown>;
    count: (a: Record<string, unknown>) => Promise<number>;
  };
  return {
    list: async (search?: string) => {
      const where = search && searchFields.length ? { OR: searchFields.map((f) => ({ [f]: { contains: search } })) } : {};
      const items = await model.findMany({ where, orderBy: { createdAt: "desc" }, take: 100, ...(include ? { include } : {}) });
      return { items, total: items.length };
    },
    getById: (id: string) => model.findUnique({ where: { id }, ...(include ? { include } : {}) }) as Promise<unknown>,
    create: async (input: unknown, userId: string) => {
      const r = validate(schema, input); if (!r.success) return r;
      const data = { ...(r.data as Record<string, unknown>), organizationId: ORG_ID, ...(extraCreateData ?? {}) };
      const item = await model.create({ data });
      try { await db.operationLog.create({ data: { userId, action: "CREATE", entityType: entity as string, entityId: item.id } }); } catch { /* log failure should not block the API */ }
      return { success: true as const, data: item };
    },
    update: async (id: string, input: unknown, userId: string) => {
      const r = validate((schema as unknown as { partial: () => ZodSchema }).partial(), input); if (!r.success) return r;
      const item = await model.update({ where: { id }, data: r.data as Record<string, unknown> });
      try { await db.operationLog.create({ data: { userId, action: "UPDATE", entityType: entity as string, entityId: id } }); } catch { /* log failure should not block the API */ }
      return { success: true as const, data: item };
    },
    delete: async (id: string, userId: string) => {
      await model.delete({ where: { id } });
      try { await db.operationLog.create({ data: { userId, action: "DELETE", entityType: entity as string, entityId: id } }); } catch { /* log failure should not block the API */ }
      return { success: true as const };
    },
  };
}

export const businessOrderService = createService("businessOrder", businessOrderSchema, ["orderNo", "title"], undefined, { customer: true });
export const feeItemService = createService("feeItem", feeItemSchema, ["description", "feeType"], undefined, { businessOrder: true });
export const revenueOrderService = createService("revenueOrder", revenueOrderSchema, ["orderNo", "title"], undefined, { customer: true, businessOrder: true });
export const settlementService = createService("settlement", settlementSchema, ["settlementNo", "title"], undefined, { customer: true, revenueOrder: true });
