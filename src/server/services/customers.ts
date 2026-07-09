import { customerRepo } from "@/server/repositories/customers";
import { validate } from "@/lib/validators";
import { customerSchema } from "@/schemas/customer";
import { db } from "@/lib/db";

export const customerService = {
  list: (p: { search?: string; page?: number; pageSize?: number }) => customerRepo.findAll(p),
  getById: (id: string) => customerRepo.findById(id),

  create: async (input: unknown, userId: string, orgId: string) => {
    const r = validate(customerSchema, input);
    if (!r.success) return r;
    const customer = await customerRepo.create({ ...r.data as Record<string, unknown>, organization: { connect: { id: orgId } } } as Parameters<typeof customerRepo.create>[0]);
    await db.operationLog.create({ data: { userId, action: "CREATE", entityType: "customer", entityId: customer.id } });
    return { success: true as const, data: customer };
  },

  update: async (id: string, input: unknown, userId: string) => {
    const r = validate(customerSchema.partial(), input);
    if (!r.success) return r;
    const customer = await customerRepo.update(id, r.data as Record<string, unknown>);
    await db.operationLog.create({ data: { userId, action: "UPDATE", entityType: "customer", entityId: id } });
    return { success: true as const, data: customer };
  },

  delete: async (id: string, userId: string) => {
    await customerRepo.delete(id);
    await db.operationLog.create({ data: { userId, action: "DELETE", entityType: "customer", entityId: id } });
    return { success: true as const };
  },
};
