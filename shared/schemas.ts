import { z } from "zod";

export const ROLES = ["CUSTOMER", "ADMIN"] as const;
export const ORDER_STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  email: z.string().email("Email invalido"),
  password: z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(100),
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email("Email invalido"),
  password: z.string().min(1, "La contrasena es requerida"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const variantInputSchema = z.object({
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.coerce.number().int().min(0),
  sku: z.string().min(1),
});
export type VariantInput = z.infer<typeof variantInputSchema>;

export const productCreateSchema = z.object({
  name: z.string().min(2).max(120),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido (usar minusculas y guiones)"),
  description: z.string().min(10),
  priceCents: z.coerce.number().int().min(0),
  compareAtPriceCents: z.coerce.number().int().min(0).nullable().optional(),
  categoryId: z.string().min(1),
  collectionId: z.string().min(1).nullable().optional(),
  featured: z.boolean().optional().default(false),
  active: z.boolean().optional().default(true),
  images: z.array(z.string()).min(1, "Al menos una imagen"),
  variants: z.array(variantInputSchema).min(1, "Al menos una variante"),
});
export type ProductCreateInput = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial();
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

export const cartAddSchema = z.object({
  variantId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(20),
});
export type CartAddInput = z.infer<typeof cartAddSchema>;

export const cartUpdateSchema = z.object({
  quantity: z.coerce.number().int().min(1).max(20),
});
export type CartUpdateInput = z.infer<typeof cartUpdateSchema>;

export const PAYMENT_METHODS = ["NARANJAX", "TRANSFER", "WHATSAPP"] as const;

const naranjaXPaymentSchema = z.object({ method: z.literal("NARANJAX") });
const transferPaymentSchema = z.object({ method: z.literal("TRANSFER") });
const whatsappPaymentSchema = z.object({ method: z.literal("WHATSAPP") });

export const checkoutPaymentSchema = z.discriminatedUnion("method", [
  naranjaXPaymentSchema,
  transferPaymentSchema,
  whatsappPaymentSchema,
]);
export type CheckoutPaymentInput = z.infer<typeof checkoutPaymentSchema>;

export const checkoutSchema = z.object({
  shippingName: z.string().min(2, "Nombre requerido"),
  shippingLine1: z.string().min(4, "Direccion requerida"),
  shippingCity: z.string().min(2, "Ciudad requerida"),
  shippingProvince: z.string().min(2, "Provincia requerida"),
  shippingPostalCode: z.string().min(3, "Codigo postal requerido"),
  shippingPhone: z.string().min(6, "Telefono requerido"),
  shippingMethodId: z.string().min(1, "Elegi un metodo de envio"),
  couponCode: z.string().trim().min(1).optional(),
  payment: checkoutPaymentSchema,
});
export type CheckoutInput = z.infer<typeof checkoutSchema>;

export const addressSchema = z.object({
  fullName: z.string().min(2, "Nombre requerido"),
  line1: z.string().min(4, "Direccion requerida"),
  city: z.string().min(2, "Ciudad requerida"),
  province: z.string().min(2, "Provincia requerida"),
  postalCode: z.string().min(3, "Codigo postal requerido"),
  phone: z.string().min(6, "Telefono requerido"),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const profileUpdateSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(80),
  email: z.string().email("Email invalido"),
});
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, "Ingresa tu contrasena actual"),
  newPassword: z.string().min(6, "La nueva contrasena debe tener al menos 6 caracteres").max(100),
});
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email invalido"),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token invalido"),
  newPassword: z.string().min(6, "La nueva contrasena debe tener al menos 6 caracteres").max(100),
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const orderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  trackingCode: z.string().trim().max(60).nullable().optional(),
});
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;

export const COUPON_TYPES = ["PERCENT", "FIXED", "FREE_SHIPPING"] as const;

export const couponCreateSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, "El codigo debe tener al menos 3 caracteres")
    .max(30)
    .transform((v) => v.toUpperCase()),
  type: z.enum(COUPON_TYPES),
  value: z.coerce.number().int().min(0),
  active: z.boolean().optional().default(true),
  minPurchaseCents: z.coerce.number().int().min(0).optional().default(0),
  maxUses: z.coerce.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;

export const couponUpdateSchema = couponCreateSchema.partial();
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const couponValidateSchema = z.object({
  code: z.string().trim().min(1),
  subtotalCents: z.coerce.number().int().min(0),
});
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;

export const settingsUpdateSchema = z.object({
  maxInstallments: z.coerce.number().int().min(1).max(24),
  freeShippingThresholdCents: z.coerce.number().int().min(0).nullable().optional(),
  whatsappPhone: z.string().trim().max(20).nullable().optional(),
  bankAlias: z.string().trim().max(60).nullable().optional(),
  bankAccountHolder: z.string().trim().max(80).nullable().optional(),
});
export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const shippingMethodCreateSchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres").max(60),
  description: z.string().trim().max(200).optional().default(""),
  priceCents: z.coerce.number().int().min(0),
  active: z.boolean().optional().default(true),
  sortOrder: z.coerce.number().int().optional().default(0),
});
export type ShippingMethodCreateInput = z.infer<typeof shippingMethodCreateSchema>;

export const shippingMethodUpdateSchema = shippingMethodCreateSchema.partial();
export type ShippingMethodUpdateInput = z.infer<typeof shippingMethodUpdateSchema>;

export const categoryCreateSchema = z.object({
  name: z.string().min(2).max(60),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido (usar minusculas y guiones)"),
});
export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;

export const collectionCreateSchema = z.object({
  name: z.string().min(2).max(80),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug invalido (usar minusculas y guiones)"),
  description: z.string().max(500).optional().default(""),
  image: z.string().optional().default(""),
  active: z.boolean().optional().default(true),
});
export type CollectionCreateInput = z.infer<typeof collectionCreateSchema>;

export const collectionUpdateSchema = collectionCreateSchema.partial();
export type CollectionUpdateInput = z.infer<typeof collectionUpdateSchema>;
