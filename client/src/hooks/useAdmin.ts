import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { Category, Collection, Coupon, CouponType, Order, OrderStatus, Product, StoreSettings } from "@/types";

export type ProductFormInput = {
  name: string;
  slug: string;
  description: string;
  priceCents: number;
  compareAtPriceCents: number | null;
  categoryId: string;
  collectionId: string | null;
  featured: boolean;
  active: boolean;
  images: string[];
  variants: { size: string; color: string; stock: number; sku: string }[];
};

export type CollectionFormInput = {
  name: string;
  slug: string;
  description: string;
  image: string;
  active: boolean;
};

export type CouponFormInput = {
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  minPurchaseCents: number;
  maxUses: number | null;
  expiresAt: string | null;
};

export function useAdminProducts() {
  return useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => api.get<{ items: Product[] }>("/admin/products"),
  });
}

export function useAdminOrders() {
  return useQuery({
    queryKey: ["admin", "orders"],
    queryFn: () => api.get<{ items: Order[] }>("/admin/orders"),
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: ProductFormInput) => api.post<{ item: Product }>("/admin/products", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      push("Producto creado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo crear el producto", "error");
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<ProductFormInput> }) =>
      api.patch<{ item: Product }>(`/admin/products/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      push("Producto actualizado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo actualizar el producto", "error");
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      push("Producto eliminado", "success");
    },
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: { name: string; slug: string }) => api.post<{ item: Category }>("/admin/categories", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      push("Categoria creada", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo crear la categoria", "error");
    },
  });
}

export function useAdminCollections() {
  return useQuery({
    queryKey: ["admin", "collections"],
    queryFn: () => api.get<{ items: Collection[] }>("/admin/collections"),
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: CollectionFormInput) => api.post<{ item: Collection }>("/admin/collections", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      push("Coleccion creada", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo crear la coleccion", "error");
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CollectionFormInput> }) =>
      api.patch<{ item: Collection }>(`/admin/collections/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      push("Coleccion actualizada", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo actualizar la coleccion", "error");
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "collections"] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      push("Coleccion eliminada", "success");
    },
  });
}

export function useUploadImage() {
  const { push } = useToast();

  return useMutation({
    mutationFn: (file: File) => api.upload<{ url: string }>("/admin/upload", file),
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo subir la imagen", "error");
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({ id, status, trackingCode }: { id: string; status: OrderStatus; trackingCode?: string }) =>
      api.patch<{ item: Order }>(`/admin/orders/${id}/status`, { status, trackingCode }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      push(variables.trackingCode ? "Estado y codigo de seguimiento enviados" : "Estado actualizado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo actualizar el pedido", "error");
    },
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => api.get<{ items: Coupon[] }>("/admin/coupons"),
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: CouponFormInput) => api.post<{ item: Coupon }>("/admin/coupons", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      push("Cupon creado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo crear el cupon", "error");
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<CouponFormInput> }) =>
      api.patch<{ item: Coupon }>(`/admin/coupons/${id}`, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      push("Cupon actualizado", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo actualizar el cupon", "error");
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/coupons/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
      push("Cupon eliminado", "success");
    },
  });
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<{ item: StoreSettings & { id: string } }>("/admin/settings"),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: {
      maxInstallments: number;
      freeShippingThresholdCents: number | null;
      whatsappPhone: string | null;
      bankAlias: string | null;
      bankAccountHolder: string | null;
    }) => api.patch<{ item: StoreSettings }>("/admin/settings", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settings"] });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      push("Configuracion guardada", "success");
    },
    onError: (error: unknown) => {
      push(error instanceof ApiClientError ? error.message : "No se pudo guardar la configuracion", "error");
    },
  });
}
