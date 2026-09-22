import type { Request, Response } from "express";
import { prisma } from "../db";
import { ApiError } from "../utils/ApiError";
import { cartAddSchema, cartUpdateSchema } from "../validation";

function serializeCartItem(item: {
  id: string;
  quantity: number;
  variant: {
    id: string;
    size: string;
    color: string;
    stock: number;
    product: { id: string; name: string; slug: string; priceCents: number; images: string };
  };
}) {
  return {
    id: item.id,
    quantity: item.quantity,
    variant: {
      id: item.variant.id,
      size: item.variant.size,
      color: item.variant.color,
      stock: item.variant.stock,
    },
    product: {
      id: item.variant.product.id,
      name: item.variant.product.name,
      slug: item.variant.product.slug,
      priceCents: item.variant.product.priceCents,
      image: (JSON.parse(item.variant.product.images) as string[])[0],
    },
  };
}

async function getCartWithDetails(userId: string) {
  return prisma.cartItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { variant: { include: { product: true } } },
  });
}

export async function getCart(req: Request, res: Response) {
  const items = await getCartWithDetails(req.user!.userId);
  const serialized = items.map(serializeCartItem);
  const subtotalCents = serialized.reduce((sum, i) => sum + i.product.priceCents * i.quantity, 0);
  res.json({ items: serialized, subtotalCents });
}

export async function addToCart(req: Request, res: Response) {
  const input = cartAddSchema.parse(req.body);
  const userId = req.user!.userId;

  const variant = await prisma.productVariant.findUnique({ where: { id: input.variantId } });
  if (!variant) {
    throw new ApiError(404, "Variante no encontrada");
  }

  const existing = await prisma.cartItem.findUnique({
    where: { userId_variantId: { userId, variantId: input.variantId } },
  });

  const desiredQuantity = (existing?.quantity ?? 0) + input.quantity;
  if (desiredQuantity > variant.stock) {
    throw new ApiError(400, `Solo quedan ${variant.stock} unidades disponibles`);
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: desiredQuantity },
    });
  } else {
    await prisma.cartItem.create({
      data: { userId, variantId: input.variantId, quantity: input.quantity },
    });
  }

  const items = await getCartWithDetails(userId);
  res.status(201).json({ items: items.map(serializeCartItem) });
}

export async function updateCartItem(req: Request, res: Response) {
  const input = cartUpdateSchema.parse(req.body);
  const userId = req.user!.userId;
  const { itemId } = req.params;

  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { variant: true } });
  if (!item || item.userId !== userId) {
    throw new ApiError(404, "Item no encontrado");
  }
  if (input.quantity > item.variant.stock) {
    throw new ApiError(400, `Solo quedan ${item.variant.stock} unidades disponibles`);
  }

  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity: input.quantity } });
  const items = await getCartWithDetails(userId);
  res.json({ items: items.map(serializeCartItem) });
}

export async function removeCartItem(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { itemId } = req.params;

  const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
  if (!item || item.userId !== userId) {
    throw new ApiError(404, "Item no encontrado");
  }

  await prisma.cartItem.delete({ where: { id: itemId } });
  const items = await getCartWithDetails(userId);
  res.json({ items: items.map(serializeCartItem) });
}
