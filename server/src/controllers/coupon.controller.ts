import type { Request, Response } from "express";
import { prisma } from "../db";
import { checkCoupon } from "../lib/pricing";
import { ApiError } from "../utils/ApiError";
import { couponCreateSchema, couponUpdateSchema, couponValidateSchema } from "../validation";

export async function validateCoupon(req: Request, res: Response) {
  const input = couponValidateSchema.parse(req.body);
  const result = await checkCoupon(input.code, input.subtotalCents);

  if (!result.valid) {
    return res.status(400).json({ valid: false, message: result.message });
  }

  res.json({
    valid: true,
    code: result.coupon.code,
    type: result.coupon.type,
    discountCents: result.discountCents,
    freeShipping: result.freeShipping,
  });
}

export async function adminListCoupons(_req: Request, res: Response) {
  const items = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  res.json({ items });
}

export async function adminCreateCoupon(req: Request, res: Response) {
  const input = couponCreateSchema.parse(req.body);

  const existing = await prisma.coupon.findUnique({ where: { code: input.code } });
  if (existing) {
    throw new ApiError(409, "Ya existe un cupon con ese codigo");
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: input.code,
      type: input.type,
      value: input.value,
      active: input.active ?? true,
      minPurchaseCents: input.minPurchaseCents ?? 0,
      maxUses: input.maxUses ?? null,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    },
  });

  res.status(201).json({ item: coupon });
}

export async function adminUpdateCoupon(req: Request, res: Response) {
  const input = couponUpdateSchema.parse(req.body);
  const { id } = req.params;

  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Cupon no encontrado");
  }

  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(input.code !== undefined ? { code: input.code } : {}),
      ...(input.type !== undefined ? { type: input.type } : {}),
      ...(input.value !== undefined ? { value: input.value } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.minPurchaseCents !== undefined ? { minPurchaseCents: input.minPurchaseCents } : {}),
      ...(input.maxUses !== undefined ? { maxUses: input.maxUses } : {}),
      ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt ? new Date(input.expiresAt) : null } : {}),
    },
  });

  res.json({ item: coupon });
}

export async function adminDeleteCoupon(req: Request, res: Response) {
  const { id } = req.params;
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) {
    throw new ApiError(404, "Cupon no encontrado");
  }
  await prisma.coupon.delete({ where: { id } });
  res.status(204).send();
}
