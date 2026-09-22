import type { Request, Response } from "express";
import { prisma } from "../db";
import { ApiError } from "../utils/ApiError";
import { shippingMethodCreateSchema, shippingMethodUpdateSchema } from "../validation";

export async function listShippingMethods(_req: Request, res: Response) {
  const items = await prisma.shippingMethod.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json({ items });
}

export async function adminListShippingMethods(_req: Request, res: Response) {
  const items = await prisma.shippingMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });
  res.json({ items });
}

export async function adminCreateShippingMethod(req: Request, res: Response) {
  const input = shippingMethodCreateSchema.parse(req.body);
  const item = await prisma.shippingMethod.create({ data: input });
  res.status(201).json({ item });
}

export async function adminUpdateShippingMethod(req: Request, res: Response) {
  const input = shippingMethodUpdateSchema.parse(req.body);
  const { id } = req.params;

  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Metodo de envio no encontrado");
  }

  const item = await prisma.shippingMethod.update({ where: { id }, data: input });
  res.json({ item });
}

export async function adminDeleteShippingMethod(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.shippingMethod.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Metodo de envio no encontrado");
  }
  await prisma.shippingMethod.delete({ where: { id } });
  res.status(204).send();
}
