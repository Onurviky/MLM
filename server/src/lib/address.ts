import { prisma } from "../db";
import type { AddressInput } from "../validation";

export async function upsertAddress(userId: string, data: AddressInput) {
  const existing = await prisma.address.findFirst({ where: { userId } });
  if (existing) {
    return prisma.address.update({ where: { id: existing.id }, data });
  }
  return prisma.address.create({ data: { userId, ...data } });
}
