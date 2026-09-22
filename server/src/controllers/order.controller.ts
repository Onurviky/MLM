import type { Request, Response } from "express";
import { prisma } from "../db";
import { upsertAddress } from "../lib/address";
import { sendTrackingEmail } from "../lib/mailer";
import { getPaymentClient, isMercadoPagoConfigured } from "../lib/mercadopago";
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

const REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_insufficient_amount: "Fondos insuficientes en la tarjeta",
  cc_rejected_bad_filled_card_number: "Revisa el numero de tarjeta",
  cc_rejected_bad_filled_date: "Revisa la fecha de vencimiento",
  cc_rejected_bad_filled_security_code: "Revisa el codigo de seguridad",
  cc_rejected_call_for_authorize: "Tu banco requiere autorizar el pago",
  cc_rejected_card_disabled: "La tarjeta esta deshabilitada",
  cc_rejected_high_risk: "El pago fue rechazado por seguridad",
};

const MANUAL_PAYMENT_STATUS_DETAIL: Record<string, string> = {
  TRANSFER: "Pendiente de confirmacion de transferencia",
  WHATSAPP: "Pendiente de confirmacion por WhatsApp",
};

export async function checkout(req: Request, res: Response) {
  const input = checkoutSchema.parse(req.body);
  const userId = req.user!.userId;

  if (input.payment.method === "MERCADOPAGO" && !isMercadoPagoConfigured()) {
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
      installments: input.payment.method === "MERCADOPAGO" ? input.payment.installments : 1,
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

  if (input.payment.method !== "MERCADOPAGO") {
    // Transferencia / WhatsApp: no hay confirmacion automatica de pago, asi que reservamos el
    // stock ya mismo (a diferencia del flujo de Mercado Pago, que espera la aprobacion) para
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

  try {
    let status: string | undefined;
    let statusDetail: string;
    let paymentId: string;

    if (process.env.MP_SIMULATE === "true") {
      // Credenciales de MP configuradas son de produccion y no hay sandbox disponible;
      // esto simula la respuesta de Mercado Pago para poder probar el flujo localmente.
      const rejected = input.payment.token === "simulate_rejected";
      status = rejected ? "rejected" : "approved";
      statusDetail = rejected ? "cc_rejected_other_reason" : "accredited";
      paymentId = `SIMULATED-${order.id}`;
    } else {
      const paymentClient = getPaymentClient();
      const response = await paymentClient.create({
        body: {
          transaction_amount: totalCents / 100,
          token: input.payment.token,
          description: `Pedido MLM #${order.id.slice(-8).toUpperCase()}`,
          installments: input.payment.installments,
          payment_method_id: input.payment.paymentMethodId,
          issuer_id: input.payment.issuerId ? Number(input.payment.issuerId) : undefined,
          external_reference: order.id,
          payer: {
            email: input.payment.payerEmail,
            identification:
              input.payment.identificationType && input.payment.identificationNumber
                ? { type: input.payment.identificationType, number: input.payment.identificationNumber }
                : undefined,
          },
        },
      });

      status = response.status;
      statusDetail = response.status_detail ?? "";
      paymentId = String(response.id ?? "");
    }

    if (status === "approved") {
      await finalizeApprovedOrder(order.id, paymentId, statusDetail);
      await prisma.cartItem.deleteMany({ where: { userId } });
    } else if (status === "in_process" || status === "pending") {
      await prisma.order.update({ where: { id: order.id }, data: { paymentId, paymentStatusDetail: statusDetail } });
      await prisma.cartItem.deleteMany({ where: { userId } });
    } else {
      await markOrderFailed(order.id, paymentId, statusDetail);
      const friendly = REJECTION_MESSAGES[statusDetail] ?? "El pago fue rechazado. Proba con otro medio de pago.";
      throw new ApiError(402, friendly);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    await markOrderFailed(order.id, null, "processing_error");
    console.error("Error procesando pago con Mercado Pago:", error);
    throw new ApiError(502, "No se pudo procesar el pago. Intenta nuevamente.");
  }

  const finalOrder = await prisma.order.findUnique({ where: { id: order.id }, include: { items: true } });
  res.status(201).json({ item: serializeOrder(finalOrder) });
}

export async function paymentWebhook(req: Request, res: Response) {
  try {
    const paymentId = req.query["data.id"] ?? req.body?.data?.id ?? req.body?.id;
    if (!paymentId || !isMercadoPagoConfigured()) {
      return res.status(200).send();
    }

    const paymentClient = getPaymentClient();
    const payment = await paymentClient.get({ id: String(paymentId) });
    const orderId = payment.external_reference;
    if (!orderId) return res.status(200).send();

    if (payment.status === "approved") {
      await finalizeApprovedOrder(orderId, String(payment.id ?? ""), payment.status_detail ?? "");
    } else if (payment.status === "rejected" || payment.status === "cancelled") {
      await markOrderFailed(orderId, String(payment.id ?? ""), payment.status_detail ?? "");
    }

    res.status(200).send();
  } catch (error) {
    console.error("Error procesando webhook de Mercado Pago:", error);
    res.status(200).send();
  }
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
