import type { Request, Response } from "express";
import { prisma } from "../db";
import { upsertAddress } from "../lib/address";
import { sendTrackingEmail } from "../lib/mailer";
import {
  createCheckout,
  getPaymentStatus,
  isNaranjaXConfigured,
  isNaranjaXSimulated,
  type NaranjaXPaymentStatus,
} from "../lib/naranjax";
import { checkCoupon, computeShippingCents } from "../lib/pricing";
import { ApiError } from "../utils/ApiError";
import { checkoutSchema, orderStatusSchema } from "../validation";

function serializeOrder<T>(order: T) {
  return order;
}

async function decrementStockAndCoupon(items: { variantId: string; quantity: number }[], couponCode: string | null) {
  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { decrement: item.quantity } } });
    }
    if (couponCode) {
      await tx.coupon.updateMany({ where: { code: couponCode }, data: { usesCount: { increment: 1 } } });
    }
  });
}

async function finalizeApprovedOrder(orderId: string, paymentId: string, statusDetail: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.status === "PAID") return;

  await decrementStockAndCoupon(
    order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    order.couponCode,
  );
  await prisma.order.update({
    where: { id: orderId },
    data: { status: "PAID", paymentId, paymentStatusDetail: statusDetail },
  });
}

async function markOrderFailed(orderId: string, paymentId: string | null, statusDetail: string) {
  await prisma.order.updateMany({
    where: { id: orderId, status: { not: "PAID" } },
    data: { status: "CANCELLED", paymentId: paymentId ?? undefined, paymentStatusDetail: statusDetail },
  });
}

async function applyPaymentStatus(orderId: string, paymentId: string, status: NaranjaXPaymentStatus) {
  if (status === "approved") {
    await finalizeApprovedOrder(orderId, paymentId, "approved");
    const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true } });
    if (order) await prisma.cartItem.deleteMany({ where: { userId: order.userId } });
  } else if (status === "rejected") {
    await markOrderFailed(orderId, paymentId, "rejected");
  }
}

const MANUAL_PAYMENT_STATUS_DETAIL: Record<string, string> = {
  TRANSFER: "Pendiente de confirmacion de transferencia",
  WHATSAPP: "Pendiente de confirmacion por WhatsApp",
};

export async function checkout(req: Request, res: Response) {
  const input = checkoutSchema.parse(req.body);
  const userId = req.user!.userId;

  if (input.payment.method === "NARANJAX" && !isNaranjaXConfigured()) {
    throw new ApiError(503, "Los pagos no estan configurados todavia. Contacta al administrador.");
  }

  const shippingMethod = await prisma.shippingMethod.findUnique({ where: { id: input.shippingMethodId } });
  if (!shippingMethod || !shippingMethod.active) {
    throw new ApiError(400, "Elegi un metodo de envio valido");
  }

  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: { variant: { include: { product: true } } },
  });

  if (cartItems.length === 0) {
    throw new ApiError(400, "El carrito esta vacio");
  }

  for (const item of cartItems) {
    if (item.quantity > item.variant.stock) {
      throw new ApiError(400, `"${item.variant.product.name}" (${item.variant.size}) no tiene stock suficiente`);
    }
  }

  const subtotalCents = cartItems.reduce((sum, i) => sum + i.variant.product.priceCents * i.quantity, 0);

  let discountCents = 0;
  let freeShipping = false;
  let couponCode: string | null = null;

  if (input.couponCode) {
    const result = await checkCoupon(input.couponCode, subtotalCents);
    if (!result.valid) {
      throw new ApiError(400, result.message);
    }
    discountCents = result.discountCents;
    freeShipping = result.freeShipping;
    couponCode = result.coupon.code;
  }

  const shippingCents = await computeShippingCents(subtotalCents, freeShipping, shippingMethod.priceCents);
  const totalCents = Math.max(0, subtotalCents - discountCents) + shippingCents;

  const order = await prisma.order.create({
    data: {
      userId,
      status: "PENDING",
      subtotalCents,
      discountCents,
      shippingCents,
      totalCents,
      couponCode,
      paymentMethod: input.payment.method,
      shippingMethodName: shippingMethod.name,
      shippingName: input.shippingName,
      shippingLine1: input.shippingLine1,
      shippingCity: input.shippingCity,
      shippingProvince: input.shippingProvince,
      shippingPostalCode: input.shippingPostalCode,
      shippingPhone: input.shippingPhone,
      items: {
        create: cartItems.map((i) => ({
          variantId: i.variantId,
          productName: i.variant.product.name,
          size: i.variant.size,
          color: i.variant.color,
          unitPriceCents: i.variant.product.priceCents,
          quantity: i.quantity,
        })),
      },
    },
    include: { items: true },
  });

  await upsertAddress(userId, {
    fullName: input.shippingName,
    line1: input.shippingLine1,
    city: input.shippingCity,
    province: input.shippingProvince,
    postalCode: input.shippingPostalCode,
    phone: input.shippingPhone,
  });

  if (input.payment.method !== "NARANJAX") {
    // Transferencia / WhatsApp: no hay confirmacion automatica de pago, asi que reservamos el
    // stock ya mismo (a diferencia del flujo de Naranja X, que espera la aprobacion) para
    // no venderlo dos veces mientras el admin verifica el pago manualmente.
    await decrementStockAndCoupon(
      order.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
      couponCode,
    );
    await prisma.cartItem.deleteMany({ where: { userId } });
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatusDetail: MANUAL_PAYMENT_STATUS_DETAIL[input.payment.method] },
    });

    const finalOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
    res.status(201).json({ item: serializeOrder(finalOrder) });
    return;
  }

  // Naranja X: el cliente paga en la pagina de Naranja X. El carrito se vacia recien cuando el pago
  // se aprueba, para que no lo pierda si abandona o le rechazan el pago.
  try {
    const payer = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    const { paymentId, checkoutUrl } = await createCheckout({
      orderId: order.id,
      totalCents,
      description: `Pedido MLM #${order.id.slice(-8).toUpperCase()}`,
      payerEmail: payer?.email ?? "",
    });
    const pendingOrder = await prisma.order.update({
      where: { id: order.id },
      data: { paymentId, paymentStatusDetail: "Esperando pago en Naranja X" },
      include: { items: true },
    });
    res.status(201).json({ item: serializeOrder(pendingOrder), checkoutUrl });
  } catch (error) {
    await markOrderFailed(order.id, null, "processing_error");
    console.error("Error creando el cobro en Naranja X:", error);
    throw new ApiError(502, "No se pudo iniciar el pago con Naranja X. Intenta nuevamente.");
  }
}

// El cliente vuelve de Naranja X a la pagina del pedido y esta consulta el estado real del cobro
// (por si el webhook todavia no llego o no puede llegar, como en desarrollo local).
export async function syncPayment(req: Request, res: Response) {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.userId !== req.user!.userId) {
    throw new ApiError(404, "Pedido no encontrado");
  }

  if (order.paymentMethod === "NARANJAX" && order.status === "PENDING" && order.paymentId && !isNaranjaXSimulated()) {
    try {
      const status = await getPaymentStatus(order.paymentId);
      await applyPaymentStatus(order.id, order.paymentId, status);
    } catch (error) {
      console.error("Error consultando el pago en Naranja X:", error);
    }
  }

  const updated = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  res.json({ item: serializeOrder(updated) });
}

export async function paymentWebhook(req: Request, res: Response) {
  // TODO(Naranja X): ajustar de donde sale el id del cobro segun el formato real de la notificacion.
  // Nunca se confia en el estado que viene en el body: siempre se vuelve a consultar a Naranja X.
  try {
    const paymentId = req.body?.payment_id ?? req.body?.id ?? req.query.id;
    if (!paymentId || !isNaranjaXConfigured() || isNaranjaXSimulated()) {
      return res.status(200).send();
    }

    const order = await prisma.order.findFirst({ where: { paymentId: String(paymentId) } });
    if (!order) return res.status(200).send();

    const status = await getPaymentStatus(order.paymentId!);
    await applyPaymentStatus(order.id, order.paymentId!, status);
    res.status(200).send();
  } catch (error) {
    console.error("Error procesando webhook de Naranja X:", error);
    res.status(200).send();
  }
}

// Solo con NX_SIMULATE=true: reemplaza la pagina de pago de Naranja X para probar el flujo localmente.
export async function simulatePayment(req: Request, res: Response) {
  if (!isNaranjaXSimulated()) {
    throw new ApiError(404, "No encontrado");
  }
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.userId !== req.user!.userId || order.paymentMethod !== "NARANJAX") {
    throw new ApiError(404, "Pedido no encontrado");
  }
  if (order.status === "PENDING" && order.paymentId) {
    await applyPaymentStatus(order.id, order.paymentId, req.body?.approve ? "approved" : "rejected");
  }
  const updated = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  res.json({ item: serializeOrder(updated) });
}

export async function listMyOrders(req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    where: { userId: req.user!.userId },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  res.json({ items: orders.map(serializeOrder) });
}

export async function getMyOrder(req: Request, res: Response) {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  });
  if (!order || (order.userId !== req.user!.userId && req.user!.role !== "ADMIN")) {
    throw new ApiError(404, "Pedido no encontrado");
  }
  res.json({ item: serializeOrder(order) });
}

export async function adminListOrders(_req: Request, res: Response) {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, user: { select: { name: true, email: true } } },
  });
  res.json({ items: orders.map(serializeOrder) });
}

export async function adminUpdateOrderStatus(req: Request, res: Response) {
  const input = orderStatusSchema.parse(req.body);
  const existing = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    throw new ApiError(404, "Pedido no encontrado");
  }

  const trackingCode = input.trackingCode?.trim() || undefined;

  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      status: input.status,
      ...(trackingCode !== undefined ? { trackingCode } : {}),
    },
    include: { items: true, user: { select: { name: true, email: true } } },
  });

  if (trackingCode) {
    try {
      await sendTrackingEmail({
        to: order.user.email,
        name: order.user.name,
        orderId: order.id,
        trackingCode,
      });
    } catch (error) {
      console.error("Error enviando email de seguimiento:", error);
    }
  }

  res.json({ item: serializeOrder(order) });
}
