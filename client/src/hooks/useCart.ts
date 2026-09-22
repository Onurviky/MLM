import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import type { Cart } from "@/types";

export function useCart(enabled: boolean) {
  return useQuery({
    queryKey: ["cart"],
    queryFn: () => api.get<Cart>("/cart"),
    enabled,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: (input: { variantId: string; quantity: number }) =>
      api.post<{ items: Cart["items"] }>("/cart", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (error: unknown) => {
      const message = error instanceof ApiClientError ? error.message : "No se pudo agregar al carrito";
      push(message, "error");
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  const { push } = useToast();

  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.patch<{ items: Cart["items"] }>(`/cart/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
    onError: (error: unknown) => {
      const message = error instanceof ApiClientError ? error.message : "No se pudo actualizar la cantidad";
      push(message, "error");
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (itemId: string) => api.delete<{ items: Cart["items"] }>(`/cart/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });
}
