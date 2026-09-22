export type Role = "CUSTOMER" | "ADMIN";
export type OrderStatus = "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type Address = {
  fullName: string;
  line1: string;
  city: string;
  province: string;
  postalCode: string;
  phone: string;
};

export type User = {
  id: string;
  email: string;
  name: string;
  role: Role;
  address: Address | null;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
};

export type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  active: boolean;
  createdAt: string;
};

export type Variant = {
  id: string;
  size: string;
  color: string;
  stock: number;
  sku: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  images: string[];
  featured: boolean;
  active: boolean;
  categoryId: string;
  category: Category;
  collectionId: string | null;
  collection: Collection | null;
  variants: Variant[];
  createdAt: string;
};

export type ShippingMethod = {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  active: boolean;
  sortOrder: number;
};

export type PaymentMethod = "MERCADOPAGO" | "TRANSFER" | "WHATSAPP";

export type CartItem = {
  id: string;
  quantity: number;
  variant: { id: string; size: string; color: string; stock: number };
  product: { id: string; name: string; slug: string; priceCents: number; image: string };
};

export type Cart = {
  items: CartItem[];
  subtotalCents: number;
};

export type OrderItem = {
  id: string;
  productName: string;
  size: string;
  color: string;
  unitPriceCents: number;
  quantity: number;
};

export type Order = {
  id: string;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingCents: number;
  totalCents: number;
  couponCode: string | null;
  installments: number;
  paymentMethod: PaymentMethod;
  paymentStatusDetail: string | null;
  trackingCode: string | null;
  shippingMethodName: string;
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingPhone: string;
  items: OrderItem[];
  createdAt: string;
  user?: { name: string; email: string };
};

export type PaginatedProducts = {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type CouponType = "PERCENT" | "FIXED" | "FREE_SHIPPING";

export type Coupon = {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  minPurchaseCents: number;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  createdAt: string;
};

export type AppliedCoupon = {
  code: string;
  type: CouponType;
  discountCents: number;
  freeShipping: boolean;
};

export type StoreSettings = {
  maxInstallments: number;
  freeShippingThresholdCents: number | null;
  mercadoPagoConfigured: boolean;
  whatsappPhone: string | null;
  bankAlias: string | null;
  bankAccountHolder: string | null;
};
