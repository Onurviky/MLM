import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Order } from "@/types";

export type CheckoutInput = {
  shippingName: string;
  shippingLine1: string;
  shippingCity: string;
  shippingProvince: string;
  shippingPostalCode: string;
  shippingPhone: string;
  shippingMethodId: string;
  couponCode?: string;
  payment: { method: "NARANJAX" } | { method: "TRANSFER" } | { method: "WHATSAPP" };
};

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CheckoutInput) => api.post<{ item: Order; checkoutUrl?: string }>("/orders", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useSyncPayment(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id, "sync-payment"],
    queryFn: () => api.post<{ item: Order }>(`/orders/${id}/sync-payment`),
    enabled: Boolean(id),
  });
}

export function useSimulatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, approve }: { id: string; approve: boolean }) =>
      api.post<{ item: Order }>(`/orders/${id}/simulate-payment`, { approve }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useMyOrders(enabled: boolean) {
  return useQuery({
    queryKey: ["orders"],
    queryFn: () => api.get<{ items: Order[] }>("/orders"),
    enabled,
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({
    queryKey: ["orders", id],
    queryFn: () => api.get<{ item: Order }>(`/orders/${id}`),
    enabled: Boolean(id),
  });
}
