import { prisma } from "../db";

export type Coupon = {
  id: string;
  code: string;
  type: string;
  value: number;
  active: boolean;
  minPurchaseCents: number;
  maxUses: number | null;
  usesCount: number;
  expiresAt: Date | null;
};

export type CouponCheckResult =
  | { valid: true; coupon: Coupon; discountCents: number; freeShipping: boolean }
  | { valid: false; message: string };

export async function checkCoupon(code: string, subtotalCents: number): Promise<CouponCheckResult> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.active) {
    return { valid: false, message: "Cupon invalido" };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, message: "El cupon esta vencido" };
  }
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
    return { valid: false, message: "El cupon alcanzo el limite de usos" };
  }
  if (subtotalCents < coupon.minPurchaseCents) {
    return { valid: false, message: `Compra minima requerida: ${(coupon.minPurchaseCents / 100).toFixed(0)} ARS` };
  }

  if (coupon.type === "PERCENT") {
    const discountCents = Math.round((subtotalCents * coupon.value) / 100);
    return { valid: true, coupon, discountCents, freeShipping: false };
  }
  if (coupon.type === "FIXED") {
    const discountCents = Math.min(coupon.value, subtotalCents);
    return { valid: true, coupon, discountCents, freeShipping: false };
  }
  return { valid: true, coupon, discountCents: 0, freeShipping: true };
}

export async function getStoreSettings() {
  const settings = await prisma.storeSettings.findUnique({ where: { id: "singleton" } });
  if (settings) return settings;
  return prisma.storeSettings.create({
    data: { id: "singleton", maxInstallments: 1, freeShippingThresholdCents: null },
  });
}

export async function computeShippingCents(
  subtotalCents: number,
  freeShipping: boolean,
  methodPriceCents: number,
): Promise<number> {
  const settings = await getStoreSettings();
  if (freeShipping) return 0;
  if (settings.freeShippingThresholdCents !== null && subtotalCents >= settings.freeShippingThresholdCents) {
    return 0;
  }
  return methodPriceCents;
}
