import { db } from "@/lib/db";
import type { Prisma } from "@prisma/client";

export const customerRepo = {
  findAll: async (params?: { search?: string; page?: number; pageSize?: number }) => {
    const { search, page = 1, pageSize = 20 } = params ?? {};
    const where: Prisma.CustomerWhereInput = search ? { OR: [{ name: { contains: search } }, { taxNo: { contains: search } }] } : {};
    const [items, total] = await Promise.all([db.customer.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize }), db.customer.count({ where })]);
    return { items, total, page, pageSize };
  },
  findById: (id: string) => db.customer.findUnique({ where: { id } }),
  create: (data: Prisma.CustomerCreateInput) => db.customer.create({ data }),
  update: (id: string, data: Prisma.CustomerUpdateInput) => db.customer.update({ where: { id }, data }),
  delete: (id: string) => db.customer.delete({ where: { id } }),
};
